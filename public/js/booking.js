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
});

router.get("/api/booking/available/:maPhong", async (req, res) => {
  let connection;
  try {
    const { maPhong } = req.params;
    connection = await pool.getConnection();

    const [roomInfo] = await connection.execute(
      "SELECT * FROM thongTinPhong WHERE maPhong = ?",
      [maPhong]
    );

    if (roomInfo.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy phòng" });
    }

    const [prices] = await connection.execute(
      "SELECT khungGio, gia FROM giaKhungGio WHERE maPhong = ?",
      [maPhong]
    );

    const [bookings] = await connection.execute(
      `SELECT ngayDat, khungGio, trangThai 
            FROM datPhongTheoGio 
            WHERE maPhong = ? 
            AND ngayDat BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
            AND trangThai NOT IN ('daHuy', 'quaHan')`,
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
    const todayNormalized = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    for (let i = 0; i < 7; i++) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() + i);

      const checkDateNormalized = new Date(
        checkDate.getFullYear(),
        checkDate.getMonth(),
        checkDate.getDate()
      );

      const yyyy = checkDateNormalized.getFullYear();
      const mm = String(checkDateNormalized.getMonth() + 1).padStart(2, "0");
      const dd = String(checkDateNormalized.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const daySchedule = { date: dateStr, slots: {} };

      khungGioList.forEach((slot) => {
        const price = prices.find((p) => p.khungGio === slot)?.gia || 0;

        const booking = bookings.find((b) => {
          const bookingDateStr =
            b.ngayDat instanceof Date
              ? b.ngayDat.toISOString().split("T")[0]
              : b.ngayDat;
          return bookingDateStr === dateStr && b.khungGio === slot;
        });

        let isPast = false;

        if (checkDateNormalized.getTime() === todayNormalized.getTime()) {
          const [start] = slot.split("-");
          const [startHour, startMin] = start.split(":").map(Number);

          const startTime = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            startHour,
            startMin,
            0,
            0
          );

          if (now.getTime() >= startTime.getTime()) {
            isPast = true;
          }
        }

        let status = booking
          ? booking.trangThai === "daXacNhan"
            ? "booked"
            : "pending"
          : "available";

        if (isPast) {
          status = "past";
        }

        daySchedule.slots[slot] = {
          price: price,
          status: status,
        };
      });
      schedule.push(daySchedule);
    }
    res.json({
      room: roomInfo[0],
      schedule: schedule,
    });
  } catch (error) {
    console.error("Error in /api/booking/available:", error);
    res.status(500).json({ error: "Lỗi server" });
  } finally {
    if (connection) connection.release();
  }
});

// API tạo booking mới
router.post("/api/booking/create", async (req, res) => {
  const {
    maPhong,
    hoTen,
    sdt,
    soLuongKhach,
    slots,
    cccdMatTruoc,
    cccdMatSau,
    ghiChu,
    idNguoiDung,
  } = req.body;

  if (!hoTen || !sdt || !maPhong || !slots || slots.length === 0) {
    return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const bookingIds = [];

      for (const slot of slots) {
        const [existing] = await connection.execute(
          `SELECT id FROM datPhongTheoGio 
                    WHERE maPhong = ? AND ngayDat = ? AND khungGio = ?
                    AND trangThai NOT IN ('daHuy', 'quaHan')`,
          [maPhong, slot.ngayDat, slot.khungGio]
        );

        if (existing.length > 0) {
          await connection.rollback();
          return res.status(400).json({
            error: `Khung giờ ${slot.khungGio} ngày ${slot.ngayDat} đã được đặt`,
          });
        }
      }

      for (const slot of slots) {
        const [result] = await connection.execute(
          `INSERT INTO datPhongTheoGio 
                    (idNguoiDung, maPhong, hoTen, sdt, soLuongKhach, ngayDat, khungGio, 
                    giaKhungGio, cccdMatTruoc, cccdMatSau, ghiChu, trangThai)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'choXacNhan')`,
          [
            idNguoiDung || null,
            maPhong,
            hoTen,
            sdt,
            soLuongKhach || 2,
            slot.ngayDat,
            slot.khungGio,
            slot.giaKhungGio,
            cccdMatTruoc || null,
            cccdMatSau || null,
            ghiChu || null,
          ]
        );
        bookingIds.push(result.insertId);
      }

      await connection.commit();
      res.json({
        success: true,
        message: "Đặt phòng thành công",
        bookingIds: bookingIds,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error in /api/booking/create:", error);
    res.status(500).json({ error: "Lỗi khi đặt phòng" });
  } finally {
    if (connection) connection.release();
  }
});

//lấy thông tin booking của user
router.get("/api/booking/user/:idNguoiDung", async (req, res) => {
  let connection;
  try {
    const { idNguoiDung } = req.params;
    connection = await pool.getConnection();

    const [bookings] = await connection.execute(
      `SELECT 
            dp.*, tp.tenPhong, tp.hinhAnh, tp.tenHomestay, tp.diaChi
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

// hủy booking
router.put("/api/booking/cancel/:bookingId", async (req, res) => {
  let connection;
  try {
    const { bookingId } = req.params;
    connection = await pool.getConnection();

    const [booking] = await connection.execute(
      "SELECT * FROM datPhongTheoGio WHERE id = ?",
      [bookingId]
    );

    if (booking.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy booking" });
    }

    const [startHour] = booking[0].khungGio.split("-")[0].split(":");
    const bookingDate = new Date(booking[0].ngayDat);
    bookingDate.setHours(parseInt(startHour), 0, 0, 0);
    const now = new Date();
    const hoursDiff = (bookingDate - now) / (1000 * 60 * 60);

    if (hoursDiff < 3) {
      return res.status(400).json({
        error: "Không thể hủy booking trong vòng 3 tiếng trước giờ check-in",
      });
    }

    await connection.execute(
      'UPDATE datPhongTheoGio SET trangThai = "daHuy" WHERE id = ?',
      [bookingId]
    );

    res.json({ success: true, message: "Đã hủy booking" });
  } catch (error) {
    console.error("Error in /api/booking/cancel:", error);
    res.status(500).json({ error: "Lỗi khi hủy booking" });
  } finally {
    if (connection) connection.release();
  }
});

// xác nhận booking
router.put("/api/booking/confirm/:bookingId", async (req, res) => {
  let connection;
  try {
    const { bookingId } = req.params;
    connection = await pool.getConnection();

    await connection.execute(
      'UPDATE datPhongTheoGio SET trangThai = "daXacNhan" WHERE id = ?',
      [bookingId]
    );

    res.json({ success: true, message: "Đã xác nhận booking" });
  } catch (error) {
    console.error("Error in /api/booking/confirm:", error);
    res.status(500).json({ error: "Lỗi khi xác nhận booking" });
  } finally {
    if (connection) connection.release();
  }
});

// lấy tất cả thông tin phòng
router.get("/api/rooms/all", async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rooms] = await connection.execute("SELECT * FROM thongTinPhong");

    res.json({ rooms: rooms });
  } catch (error) {
    console.error("Error fetching all rooms:", error);
    res.status(500).json({ error: "Lỗi khi tải danh sách phòng" });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
