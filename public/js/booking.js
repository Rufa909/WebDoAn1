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
  timezone: "+07:00",
});

async function getConnectionWithTimezone() {
  const connection = await pool.getConnection();
  await connection.execute("SET time_zone = '+07:00'");
  return connection;
}

function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/* ========================================
   FUNCTION: TẠO VIETQR ĐỘNG
   ======================================== */
function createVietQR(amount, description, bankId, accountNo, accountName, template = "compact") {
  const encodedDesc = encodeURIComponent(description);
  const encodedName = encodeURIComponent(accountName);
  const qrImageUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${amount}&addInfo=${encodedDesc}&accountName=${encodedName}`;
  return { qrImageUrl };
}

/* ========================================
   API: LẤY LỊCH CÓ SẴN (7 NGÀY TỪ HÔM NAY)
   ======================================== */
router.get("/api/booking/available/:maPhong", async (req, res) => {
  let connection;
  try {
    const { maPhong } = req.params;
    connection = await getConnectionWithTimezone();

    // 1. LẤY THÔNG TIN PHÒNG + GIÁ + SỨC CHỨA
    const [roomRows] = await connection.execute(
      `SELECT *, 
              gia AS giaQuaDem,
              giaKhungGio AS giaTheoGio,
              soLuongKhach AS sucChua
       FROM thongTinPhong 
       WHERE maPhong = ?`,
      [maPhong]
    );

    if (roomRows.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy phòng" });
    }

    const room = roomRows[0];
    const giaTheoGio = Number(room.giaTheoGio) || 0;
    const giaQuaDem = Number(room.giaQuaDem) || 0;
    const sucChua = Number(room.sucChua) || 2;

    // 2. LẤY BOOKING (có idNguoiDung)
    const [bookings] = await connection.execute(
      `SELECT ngayDat, khungGio, trangThai, idNguoiDung 
       FROM datPhongTheoGio 
       WHERE maPhong = ? 
         AND ngayDat BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
         AND trangThai IN ('daXacNhan', 'choXacNhan')`,
      [maPhong]
    );

    const schedule = [];
    const khungGioList = [
      "10:00-13:00",
      "13:30-16:30",
      "17:00-20:00",
      "20:30-09:30",
    ];
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(now.getDate() + i);
      const dateStr = formatDateLocal(checkDate);
      const daySchedule = { date: dateStr, slots: {} };

      for (const slot of khungGioList) {
        // GIÁ: ưu tiên bảng giaKhungGio (nếu có), nếu không dùng giá mặc định
        let price = giaTheoGio;
        if (slot === "20:30-09:30") {
          price = giaQuaDem;
        }

        // Nếu có giá đặc biệt trong bảng giaKhungGio → dùng nó
        const [customPrice] = await connection.execute(
          `SELECT gia FROM giaKhungGio 
           WHERE maPhong = ? AND khungGio = ? 
             AND (ngayApDung IS NULL OR ngayApDung <= ?) 
             AND (ngayKetThuc IS NULL OR ngayKetThuc >= ?)
           LIMIT 1`,
          [maPhong, slot, dateStr, dateStr]
        );
        if (customPrice.length > 0) {
          price = Number(customPrice[0].gia);
        }

        // Kiểm tra booking
        const booking = bookings.find((b) => {
          const bDate =
            b.ngayDat instanceof Date
              ? formatDateLocal(b.ngayDat)
              : String(b.ngayDat).split("T")[0];
          return bDate === dateStr && b.khungGio === slot;
        });

        let isPast = false;
        if (i === 0) {
          const [start] = slot.split("-");
          const [h, m] = start.split(":").map(Number);
          const slotTime = new Date(checkDate);
          slotTime.setHours(h, m, 0, 0);
          if (now >= slotTime) isPast = true;
        }

        let status = "available";
        let userId = null;
        if (booking) {
          userId = booking.idNguoiDung;
          status = booking.trangThai === "daXacNhan" ? "booked" : "pending";
        }
        if (isPast) status = "past";

        daySchedule.slots[slot] = { price, status, userId };
      }
      schedule.push(daySchedule);
    }

    // TRẢ VỀ room kèm sức chứa
    res.json({
      room: {
        ...room,
        sucChua: sucChua,
      },
      schedule,
    });
  } catch (error) {
    console.error("Error in /api/booking/available:", error);
    res.status(500).json({ error: "Lỗi server" });
  } finally {
    if (connection) connection.release();
  }
});

/* ========================================
   API: TẠO BOOKING MỚI + VIETQR
   ======================================== */
router.post("/api/booking/create", async (req, res) => {
  const {
    maPhong,
    hoTen,
    sdt,
    soNguoiLon,
    soTreEm,           
    danhSachTuoiTreEm, 
    ghiChu,
    idNguoiDung,
    slots,
  } = req.body;

  if (!maPhong || !hoTen || !sdt || !slots || slots.length === 0) {
    return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
  }

  const soNguoiLonNum = Number(soNguoiLon) || 0;
  const ages = Array.isArray(danhSachTuoiTreEm) ? danhSachTuoiTreEm.map(a => Number(a) || 0) : [];
  const tongKhach = soNguoiLonNum + ages.length;

  if (tongKhach === 0) {
    return res.status(400).json({ error: "Phải có ít nhất 1 khách" });
  }

  let connection;
  try {
    connection = await getConnectionWithTimezone();
    await connection.beginTransaction();

    // Lấy sức chứa phòng
    const [roomRows] = await connection.execute(
      "SELECT soLuongKhach FROM thongTinPhong WHERE maPhong = ?",
      [maPhong]
    );
    const sucChua = roomRows[0]?.soLuongKhach || 2;

    // Phân bổ chỗ (ưu tiên người lớn → trẻ 7-17 → trẻ <7)
    let remaining = sucChua;

    const allottedNguoiLon = Math.min(soNguoiLonNum, remaining);
    remaining -= allottedNguoiLon;
    const thuaNguoiLon = soNguoiLonNum - allottedNguoiLon;

    // Trẻ em 7-17 tuổi (phụ thu 20%)
    const tre7_17 = ages.filter(age => age >= 7 && age <= 17).length;
    const allottedTre7_17 = Math.min(tre7_17, remaining);
    remaining -= allottedTre7_17;
    const thuaTre7_17 = tre7_17 - allottedTre7_17;

    // Trẻ em <7 tuổi (miễn phí)
    const treDuoi7 = ages.filter(age => age < 7).length;
    const allottedTreDuoi7 = Math.min(treDuoi7, remaining);
    const thuaTreDuoi7 = treDuoi7 - allottedTreDuoi7;

    // Trọng số phụ thu
    const weightedExcess = thuaNguoiLon * 0.3 + thuaTre7_17 * 0.2;

    // Tính tổng phụ thu
    let phuThuTotal = 0;
    slots.forEach(slot => {
      phuThuTotal += slot.giaKhungGio * weightedExcess;
    });
    phuThuTotal = Math.round(phuThuTotal);

    // Ghi chú phụ thu
    let ghiChuMoi = ghiChu?.trim() || "";
    if (weightedExcess > 0) {
      const chuoiPhuThu = `Phụ thu vượt sức chứa: Người lớn ${thuaNguoiLon} × 30% + Trẻ 7-17 ${thuaTre7_17} × 20% = ${phuThuTotal.toLocaleString("vi-VN")}đ`;
      ghiChuMoi = chuoiPhuThu + (ghiChuMoi ? `\n${ghiChuMoi}` : "");
    }

    // Kiểm tra trùng slot
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

    // Tạo Order ID
    const orderId = `ALB${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const baseTotal = slots.reduce((s, x) => s + x.giaKhungGio, 0);
    const tongTien = baseTotal + phuThuTotal;
    const tienCoc = Math.round(tongTien * 0.5);

  
    

    // Tạo booking
    for (const slot of slots) {
      const giaTong = slot.giaKhungGio * (1 + weightedExcess);
      await connection.execute(
        `INSERT INTO datPhongTheoGio 
         (idNguoiDung, maPhong, hoTen, sdt, soLuongKhach, ngayDat, khungGio, 
          giaKhungGio, ghiChu, trangThai, ngayTao)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'choXacNhan', NOW())`,
        [
          idNguoiDung || null,
          maPhong,
          hoTen,
          sdt,
          tongKhach,
          slot.ngayDat,
          slot.khungGio,
          Math.round(giaTong),
          ghiChuMoi,
        ]
      );
    }

    await connection.commit();

    // ======================= TẠO VIETQR ĐỘNG =======================
    const BANK_ID = "MB";
    const ACCOUNT_NO = "0852278231";
    const ACCOUNT_NAME = "HUYNH THIEN PHUC";

    const { qrImageUrl } = createVietQR(
      tienCoc,
      `Coc Alibaba ${hoTen} ${sdt} ${orderId}`,
      BANK_ID,
      ACCOUNT_NO,
      ACCOUNT_NAME,
      "compact"
    );

    res.json({
      success: true,
      tongTien: tongTien,
      tienCoc: tienCoc,
      phuThu: phuThuTotal,
      orderId: orderId,
      qrImageUrl: qrImageUrl,
      message: `Đặt thành công! Quét QR để thanh toán cọc 50%. ${
        phuThuTotal > 0 ? `Có phụ thu ${phuThuTotal.toLocaleString("vi-VN")}đ` : ""
      }`,
    });
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
router.get(
  "/api/booking/cleanup-old-pending/:idNguoiDung",
  async (req, res) => {
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
  }
);

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
                   ${idNguoiDung ? "AND idNguoiDung = ?" : ""}`;

    const [result] = await connection.execute(sql, params);
    if (result.affectedRows === 0) {
      return res
        .status(400)
        .json({ error: "Không tìm thấy hoặc không thể hủy" });
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
   API: HỦY BOOKING 
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
    if (booking.length === 0)
      return res.status(404).json({ error: "Không tìm thấy" });

    const [start] = booking[0].khungGio.split("-");
    const [h] = start.split(":").map(Number);
    const checkinTime = new Date(booking[0].ngayDat);
    checkinTime.setHours(h, 0, 0, 0);
    const hoursDiff = (checkinTime - new Date()) / (1000 * 60 * 60);

    if (hoursDiff < 3) {
      return res
        .status(400)
        .json({ error: "Không thể hủy trong vòng 3 tiếng" });
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
  let connection;
  try {
    connection = await getConnectionWithTimezone();
    await connection.execute(
      'UPDATE datPhongTheoGio SET trangThai = "daHuy" WHERE id = ?',
      [req.params.bookingId]
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