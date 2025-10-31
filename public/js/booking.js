require("dotenv").config();
const express = require("express");
const router = express.Router();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+07:00", // Đảm bảo múi giờ Việt Nam
});

/* ========================================
   HELPER: Đặt múi giờ cho mỗi kết nối
   ======================================== */
async function getConnectionWithTimezone() {
  const connection = await pool.getConnection();
  await connection.execute("SET time_zone = '+07:00'");
  return connection;
}

/* ========================================
   API: LẤY LỊCH CÓ SẴN (7 NGÀY TỪ HÔM NAY)
   ======================================== */
router.get("/api/booking/available/:maPhong", async (req, res) => {
  let connection;
  try {
    const { maPhong } = req.params;
    connection = await getConnectionWithTimezone();

    // 1. LẤY THÔNG TIN PHÒNG
    const [roomInfo] = await connection.execute(
      "SELECT * FROM thongTinPhong WHERE maPhong = ?",
      [maPhong]
    );
    if (roomInfo.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy phòng" });
    }

    // 2. LẤY GIÁ KHUNG GIỜ
    const [prices] = await connection.execute(
      "SELECT khungGio, gia FROM giaKhungGio WHERE maPhong = ?",
      [maPhong]
    );

    // 3. LẤY BOOKING ĐANG CHỜ HOẶC ĐÃ XÁC NHẬN
    const [bookings] = await connection.execute(
      `SELECT ngayDat, khungGio, trangThai, idNguoiDung 
       FROM datPhongTheoGio 
       WHERE maPhong = ? 
         AND ngayDat BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
         AND trangThai IN ('daXacNhan', 'choXacNhan')`,
      [maPhong]
    );

    const schedule = [];
    const khungGioList = ["10:00-13:00", "13:30-16:30", "17:00-20:00", "20:30-09:30"];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // 00:00:00 hôm nay

    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      const dateStr = checkDate.toISOString().split("T")[0]; // YYYY-MM-DD

      const daySchedule = { date: dateStr, slots: {} };

      for (const slot of khungGioList) {
        const price = prices.find(p => p.khungGio === slot)?.gia || 0;

        const booking = bookings.find(b => {
          const bDate = b.ngayDat instanceof Date
            ? b.ngayDat.toISOString().split("T")[0]
            : String(b.ngayDat).split("T")[0];
          return bDate === dateStr && b.khungGio === slot;
        });

        // Kiểm tra slot đã qua (chỉ hôm nay)
        let isPast = false;
        if (i === 0) {
          const [start] = slot.split("-");
          const [h, m] = start.split(":").map(Number);
          const slotTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
          if (now >= slotTime) isPast = true;
        }

        let status = "available";
        let userId = null;

        if (booking) {
          if (booking.trangThai === "daXacNhan") {
            status = "booked";
          } else if (booking.trangThai === "choXacNhan") {
            status = "pending";
            userId = booking.idNguoiDung;
          }
        }
        if (isPast) status = "past";

        daySchedule.slots[slot] = { price, status, userId };
      }
      schedule.push(daySchedule);
    }

    res.json({ room: roomInfo[0], schedule });
  } catch (error) {
    console.error("Error in /api/booking/available:", error);
    res.status(500).json({ error: "Lỗi server" });
  } finally {
    if (connection) connection.release();
  }
});

/* ========================================
   API: TẠO BOOKING MỚI
   ======================================== */
router.post("/api/booking/create", async (req, res) => {
  const { maPhong, hoTen, sdt, soLuongKhach, ghiChu, idNguoiDung, slots } = req.body;

  if (!maPhong || !hoTen || !sdt || !slots || slots.length === 0) {
    return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
  }

  let connection;
  try {
    connection = await getConnectionWithTimezone();
    await connection.beginTransaction();

    // KIỂM TRA TRÙNG (CẢ PENDING)
    for (const slot of slots) {
      const [existing] = await connection.execute(
        `SELECT id FROM datPhongTheoGio 
         WHERE maPhong = ? AND ngayDat = ? AND khungGio = ?
           AND trangThai IN ('daXacNhan', 'choXacNhan')`,
        [maPhong, slot.ngayDat, slot.khungGio]
      );
      if (existing.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          error: `Khung giờ ${slot.khungGio} ngày ${slot.ngayDat} đã có người đặt`,
        });
      }
    }

    // TẠO BOOKING
    const bookingIds = [];
    for (const slot of slots) {
      const [result] = await connection.execute(
        `INSERT INTO datPhongTheoGio 
         (idNguoiDung, maPhong, hoTen, sdt, soLuongKhach, ngayDat, khungGio, 
          giaKhungGio, ghiChu, trangThai, ngayTao)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'choXacNhan', NOW())`,
        [
          idNguoiDung || null,
          maPhong,
          hoTen,
          sdt,
          soLuongKhach || 2,
          slot.ngayDat,
          slot.khungGio,
          slot.giaKhungGio,
          ghiChu || null,
        ]
      );
      bookingIds.push(result.insertId);
    }

    await connection.commit();
    res.json({ success: true, message: "Đặt thành công, đang chờ xác nhận", bookingIds });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error in /api/booking/create:", error);
    res.status(500).json({ error: "Lỗi khi đặt phòng" });
  } finally {
    if (connection) connection.release();
  }
});

/* ========================================
   API: DỌN PENDING CŨ (15 PHÚT)
   ======================================== */
router.get("/api/booking/cleanup-old-pending/:idNguoiDung", async (req, res) => {
  const { idNguoiDung } = req.params;
  let connection;
  try {
    connection = await getConnectionWithTimezone();
    const [result] = await connection.execute(
      `UPDATE datPhongTheoGio 
       SET trangThai = 'daHuy',
           ghiChu = CONCAT(COALESCE(ghiChu, ''), '\n[Tự động] Hủy do quá 15 phút không xác nhận')
       WHERE idNguoiDung = ? 
         AND trangThai = 'choXacNhan'
         AND ngayTao < DATE_SUB(NOW(), INTERVAL 15 MINUTE)`,
      [idNguoiDung]
    );
    res.json({ success: true, cancelled: result.affectedRows });
  } catch (error) {
    console.error("Error in cleanup-old-pending:", error);
    res.status(500).json({ error: "Lỗi server" });
  } finally {
    if (connection) connection.release();
  }
});

/* ========================================
   API: HỦY PENDING (USER)
   ======================================== */
router.put("/api/booking/cancel-pending", async (req, res) => {
  const { maPhong, ngayDat, khungGio, idNguoiDung } = req.body;
  if (!maPhong || !ngayDat || !khungGio) {
    return res.status(400).json({ error: "Thiếu thông tin" });
  }

  let connection;
  try {
    connection = await getConnectionWithTimezone();
    const params = idNguoiDung
      ? [maPhong, ngayDat, khungGio, idNguoiDung]
      : [maPhong, ngayDat, khungGio];

    const sql = `UPDATE datPhongTheoGio 
                 SET trangThai = 'daHuy', 
                     ghiChu = CONCAT(COALESCE(ghiChu, ''), '\nHủy bởi khách hàng')
                 WHERE maPhong = ? AND ngayDat = ? AND khungGio = ? 
                   AND trangThai = 'choXacNhan'
                   ${idNguoiDung ? 'AND idNguoiDung = ?' : ''}`;

    const [result] = await connection.execute(sql, params);
    if (result.affectedRows === 0) {
      return res.status(400).json({ error: "Không tìm thấy hoặc không thể hủy" });
    }
    res.json({ success: true, message: "Đã hủy đặt phòng" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi server" });
  } finally {
    if (connection) connection.release();
  }
});

/* ========================================
   API: LẤY BOOKING CỦA USER
   ======================================== */
router.get("/api/booking/user/:idNguoiDung", async (req, res) => {
  const { idNguoiDung } = req.params;
  let connection;
  try {
    connection = await getConnectionWithTimezone();
    const [bookings] = await connection.execute(
      `SELECT dp.*, tp.tenPhong, tp.hinhAnh, tp.tenHomestay, tp.diaChi
       FROM datPhongTheoGio dp
       JOIN thongTinPhong tp ON dp.maPhong = tp.maPhong
       WHERE dp.idNguoiDung = ?
       ORDER BY dp.ngayDat DESC, dp.khungGio`,
      [idNguoiDung]
    );
    res.json({ bookings });
  } catch (error) {
    console.error("Error in /api/booking/user:", error);
    res.status(500).json({ error: "Lỗi server" });
  } finally {
    if (connection) connection.release();
  }
});

/* ========================================
   API: HỦY BOOKING (USER - CÓ KIỂM TRA 3 TIẾNG)
   ======================================== */
router.put("/api/booking/cancel/:bookingId", async (req, res) => {
  const { bookingId } = req.params;
  let connection;
  try {
    connection = await getConnectionWithTimezone();

    const [booking] = await connection.execute(
      "SELECT * FROM datPhongTheoGio WHERE id = ?",
      [bookingId]
    );
    if (booking.length === 0) return res.status(404).json({ error: "Không tìm thấy" });

    const [start] = booking[0].khungGio.split("-");
    const [h] = start.split(":").map(Number);
    const checkinTime = new Date(booking[0].ngayDat);
    checkinTime.setHours(h, 0, 0, 0);
    const hoursDiff = (checkinTime - new Date()) / (1000 * 60 * 60);

    if (hoursDiff < 3) {
      return res.status(400).json({ error: "Không thể hủy trong vòng 3 tiếng" });
    }

    await connection.execute(
      'UPDATE datPhongTheoGio SET trangThai = "daHuy" WHERE id = ?',
      [bookingId]
    );
    res.json({ success: true, message: "Đã hủy" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi server" });
  } finally {
    if (connection) connection.release();
  }
});

/* ========================================
   API: XÁC NHẬN (BUSINESS)
   ======================================== */
router.put("/api/booking/confirm/:bookingId", async (req, res) => {
  let connection;
  try {
    connection = await getConnectionWithTimezone();
    await connection.execute(
      'UPDATE datPhongTheoGio SET trangThai = "daXacNhan" WHERE id = ?',
      [req.params.bookingId]
    );
    res.json({ success: true, message: "Đã xác nhận" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi server" });
  } finally {
    if (connection) connection.release();
  }
});

/* ========================================
   API: TỪ CHỐI (BUSINESS)
   ======================================== */
router.put("/api/booking/reject/:bookingId", async (req, res) => {
  const { lyDoTuChoi } = req.body;
  let connection;
  try {
    connection = await getConnectionWithTimezone();
    await connection.execute(
      `UPDATE datPhongTheoGio 
       SET trangThai = "daHuy", 
           ghiChu = CONCAT(COALESCE(ghiChu, ""), "\nLý do từ chối: ", ?)
       WHERE id = ?`,
      [lyDoTuChoi || "Không phù hợp", req.params.bookingId]
    );
    res.json({ success: true, message: "Đã từ chối" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi server" });
  } finally {
    if (connection) connection.release();
  }
});

/* ========================================
   API: LẤY TẤT CẢ PHÒNG
   ======================================== */
router.get("/api/rooms/all", async (req, res) => {
  let connection;
  try {
    connection = await getConnectionWithTimezone();
    const [rooms] = await connection.execute("SELECT * FROM thongTinPhong");
    res.json({ rooms });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi server" });
  } finally {
    if (connection) connection.release();
  }
});

/* ========================================
   API: LẤY BOOKING CỦA DOANH NGHIỆP
   ======================================== */
router.get("/api/booking/business/:maDoanhNghiep", async (req, res) => {
  const { maDoanhNghiep } = req.params;
  let connection;
  try {
    connection = await getConnectionWithTimezone();
    const [bookings] = await connection.execute(
      `SELECT dp.id, dp.maPhong, dp.hoTen, dp.sdt, dp.soLuongKhach, dp.ngayDat, 
              dp.khungGio, dp.giaKhungGio, dp.ghiChu, dp.trangThai, dp.ngayTao,
              tp.tenPhong, tp.tenHomestay, tp.hinhAnh
       FROM datPhongTheoGio dp
       JOIN thongTinPhong tp ON dp.maPhong = tp.maPhong
       WHERE tp.maDoanhNghiep = ? AND dp.ngayDat >= CURDATE()
       ORDER BY 
         CASE dp.trangThai WHEN 'choXacNhan' THEN 1 WHEN 'daXacNhan' THEN 2 ELSE 3 END,
         dp.ngayDat, dp.khungGio`,
      [maDoanhNghiep]
    );
    res.json({ bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Lỗi server" });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;