require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const app = express();
const bookingRouter = require("./public/js/booking");

const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);

// Cấu hình multer: lưu file vào public/uploads/images/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "public", "uploads", "images");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận file hình ảnh!"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter,
});

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
});

app.use(
  session({
    key: "session_cookie_name",
    secret: "super_session_key",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 },
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static("public"));
app.use("/pages", express.static("pages"));

// Kết nối DB
let db;
(async () => {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
    });
    console.log("Kết nối db thành công!");
  } catch (err) {
    console.error("lỗi kết nối db:", err);
  }
})();

app.get("/api/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const sql =
      "SELECT id, ho, ten, email, sdt, chucVu FROM users WHERE id = ?";
    const [users] = await db.execute(sql, [id]);

    if (users.length > 0) {
      res.json(users[0]);
    } else {
      res.status(404).json({ message: "Không tìm thấy người dùng." });
    }
  } catch (err) {
    console.error("Lỗi khi truy vấn người dùng:", err);
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
});

const requireLogin = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Yêu cầu đăng nhập." });
  }
  next();
};

// API Endpoint chính cho trang sơ đồ phòng của doanh nghiệp
app.get("/api/my-business-rooms", requireLogin, async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: "Chưa kết nối được với database." });
  }

  try {
    const businessId = req.session.user.id;
    const sql =
      "SELECT * FROM thongTinPhong WHERE maDoanhNghiep = ? ORDER BY tenPhong ASC";
    const [roomResults] = await db.execute(sql, [businessId]);

    res.json(roomResults);
  } catch (err) {
    console.error("Lỗi /api/my-business-rooms:", err);
    res.status(500).json({ error: "Lỗi truy vấn thông tin phòng" });
  }
});

// API: CẬP NHẬT PHÒNG (PUT) - Hỗ trợ upload hình mới nếu có
app.put(
  "/api/my-business-rooms/:maPhong",
  requireLogin,
  upload.single("hinhAnh"),
  async (req, res) => {
    const maDoanhNghiep = req.session.user.id;
    const { maPhong } = req.params;
    const {
      tenPhong,
      tenHomestay,
      diaChi,
      loaiGiuong,
      soLuongKhach,
      tienIch,
      gia,
      moTa,
      diaChiChiTiet,
      giaKhungGio,
    } = req.body;

    if (!tenPhong || !gia) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Tên phòng và giá là bắt buộc." });
    }

    try {
      // Lấy hình cũ để xóa nếu upload mới
      const [oldRoom] = await db.execute(
        "SELECT hinhAnh FROM thongTinPhong WHERE maPhong = ? AND maDoanhNghiep = ?",
        [maPhong, maDoanhNghiep]
      );
      const oldHinhAnh = oldRoom[0]?.hinhAnh;

      let hinhAnhUpdate = oldHinhAnh;
      if (req.file) {
        hinhAnhUpdate = `uploads/images/${req.file.filename}`;
        // Xóa file cũ nếu không phải default
        if (oldHinhAnh && oldHinhAnh !== "images/default-room.png") {
          const oldFilePath = path.join(__dirname, "public", oldHinhAnh);
          if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
        }
      }

      const sql = `
      UPDATE thongTinPhong 
      SET tenPhong = ?, tenHomestay = ?, diaChi = ?, loaiGiuong = ?, soLuongKhach = ?, tienIch = ?, gia = ?, hinhAnh = ?,moTa=?, diaChiChiTiet=?, giaKhungGio=?
      WHERE maPhong = ? AND maDoanhNghiep = ?`;

      const [result] = await db.execute(sql, [
        tenPhong,
        tenHomestay,
        diaChi,
        loaiGiuong,
        soLuongKhach,
        tienIch,
        gia,
        hinhAnhUpdate,
        moTa,
        diaChiChiTiet,
        giaKhungGio,
        maPhong,
        maDoanhNghiep,
      ]);

      if (result.affectedRows === 0) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(404).json({
          message: "Không tìm thấy phòng hoặc bạn không có quyền sửa.",
        });
      }

      res.status(200).json({
        message: "Cập nhật thông tin phòng thành công!",
        hinhAnh: hinhAnhUpdate,
      });
    } catch (err) {
      console.error("Lỗi khi cập nhật phòng:", err);
      if (req.file) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: "Lỗi máy chủ khi cập nhật phòng." });
    }
  }
);

// API: XÓA PHÒNG (DELETE) - Xóa file hình nếu tồn tại
app.delete(
  "/api/my-business-rooms/:maPhong",
  requireLogin,
  async (req, res) => {
    const maDoanhNghiep = req.session.user.id;
    const { maPhong } = req.params;

    try {
      // Lấy đường dẫn hình trước khi xóa
      const [room] = await db.execute(
        "SELECT hinhAnh FROM thongTinPhong WHERE maPhong = ? AND maDoanhNghiep = ?",
        [maPhong, maDoanhNghiep]
      );
      if (
        room.length > 0 &&
        room[0].hinhAnh &&
        room[0].hinhAnh !== "images/default-room.png"
      ) {
        const filePath = path.join(__dirname, "public", room[0].hinhAnh);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      const sql =
        "DELETE FROM thongTinPhong WHERE maPhong = ? AND maDoanhNghiep = ?";
      const [result] = await db.execute(sql, [maPhong, maDoanhNghiep]);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Không tìm thấy phòng hoặc bạn không có quyền xóa.",
        });
      }

      res.status(200).json({ message: "Xóa phòng thành công!" });
    } catch (err) {
      console.error("Lỗi khi xóa phòng:", err);
      res.status(500).json({ error: "Lỗi máy chủ khi xóa phòng." });
    }
  }
);

// API: THÊM PHÒNG MỚI (POST) - Hỗ trợ upload hình
app.post(
  "/api/my-business-rooms",
  requireLogin,
  upload.single("hinhAnh"),
  async (req, res) => {
    const maDoanhNghiep = String(req.session.user.id);
    const {
      idHomestay,
      tenPhong,
      tenHomestay,
      diaChi,
      loaiGiuong,
      soLuongKhach,
      tienIch,
      gia,
      moTa,
      diaChiChiTiet,
      giaKhungGio,
    } = req.body;

    if (!tenPhong || !gia) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Tên phòng và giá là bắt buộc." });
    }

    try {
      let hinhAnh = "images/default-room.png";
      if (req.file) {
        hinhAnh = `uploads/images/${req.file.filename}`;
      }

      const sql = `
      INSERT INTO thongTinPhong 
      (maDoanhNghiep, idHomestay, tenPhong, tenHomestay, diaChi, loaiGiuong, soLuongKhach, tienIch, gia, hinhAnh,moTa,diaChiChiTiet, giaKhungGio) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
      const [result] = await db.execute(sql, [
        maDoanhNghiep,
        idHomestay,
        tenPhong,
        tenHomestay,
        diaChi,
        loaiGiuong,
        soLuongKhach,
        tienIch,
        gia,
        hinhAnh,
        moTa,
        diaChiChiTiet,
        giaKhungGio,
      ]);

      res.status(201).json({
        message: "Thêm phòng thành công!",
        newRoom: {
          maPhong: result.insertId,
          idHomestay,
          maDoanhNghiep,
          tenPhong,
          tenHomestay,
          diaChi,
          loaiGiuong,
          soLuongKhach,
          tienIch,
          gia,
          hinhAnh,
          giaKhungGio,
        },
      });
    } catch (err) {
      console.error("Lỗi khi thêm phòng mới:", err);
      if (req.file) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: "Lỗi máy chủ khi thêm phòng." });
    }
  }
);

// Route đăng ký
app.post("/register", async (req, res) => {
  const {
    ho,
    ten,
    email,
    sdt,
    ngaySinh,
    gioiTinh,
    matKhau,
    xacNhanmatKhau,
    chucVu,
  } = req.body;

  if (matKhau !== xacNhanmatKhau) {
    return res.sendStatus(401);
  }
  try {
    const [existing] = await db.execute("SELECT id FROM users WHERE email=?", [
      email,
    ]);
    if (existing.length > 0) {
      return res.sendStatus(409);
    }

    const hashedPassword = await bcrypt.hash(matKhau, 10);

    const [result] = await db.execute(
      "INSERT INTO users (ho, ten, email, sdt, ngaySinh, gioiTinh, matKhau, chucVu) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        ho,
        ten,
        email,
        sdt,
        ngaySinh,
        gioiTinh,
        hashedPassword,
        chucVu || "Người Dùng",
      ]
    );

    res.sendStatus(201);
  } catch (err) {
    console.error("Lỗi /register:", err);
    res.status(500).send({ error: err.message });
  }
});

// Route đăng nhập
app.post("/login", async (req, res) => {
  const { id, ten, email, matKhau } = req.body;

  try {
    const [results] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (results.length === 0) {
      return res.sendStatus(401);
    }

    const user = results[0];
    const match = await bcrypt.compare(matKhau, user.matKhau);

    if (!match) {
      return res.sendStatus(401);
    }

    req.session.user = {
      id: user.id,
      ho: user.ho,
      ten: user.ten,
      email: user.email,
      ngaySinh: user.ngaySinh,
      gioiTinh: user.gioiTinh,
      soDienThoai: user.sdt,
      chucVu: user.chucVu,
      tenHomestay: user.tenHomestay,
    };
    console.log("User từ DB:", user);
    res.sendStatus(200);
  } catch (err) {
    console.error("Lỗi /login:", err);
    res.status(500);
  }
});

// Check email user
app.post("/checkEmail", async (req, res) => {
  const { email } = req.body;

  try {
    const [user] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (user.length === 0) {
      return res.sendStatus(404);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("Lỗi /checkEmail:", err);
    res.sendStatus(500);
  }
});

// Route quên mật khẩu
app.post("/forgotPassword", async (req, res) => {
  const { email, matKhau } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(matKhau, 10);
    await db.execute("UPDATE users SET matKhau = ? WHERE email = ?", [
      hashedPassword,
      email,
    ]);
    res.sendStatus(200);
  } catch (err) {
    console.error("Lỗi /resetPassword:", err);
    res.sendStatus(500);
  }
});

// Trang chủ
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Trang đăng ký
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "register.html"));
});

// Trang đăng nhập
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pages", "login.html"));
});

// Route logout
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.sendStatus(500);
    res.clearCookie("session_cookie_name");
    return res.sendStatus(200);
  });
});

// Lấy danh sách tất cả user
app.get("/users", async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, ho, ten, email, sdt, chucVu FROM users"
    );
    res.json(rows);
  } catch (err) {
    console.error("Lỗi /users:", err);
    res.sendStatus(500);
  }
});

// Thêm tên doanh nghiệp mặc định cho 1 businessman
app.put("/users/tendoanhnghiep/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { tenHomestay } = req.body;

    const [result] = await db.execute(
      "UPDATE users SET tenHomestay = ? WHERE id = ?",
      [tenHomestay, id]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error("Lỗi /users/tendoanhnghiep (PUT):", err);
    res.sendStatus(500);
  }
});

// Tạo mới homestay
app.post("/api/homestays", requireLogin, async (req, res) => {
  const idDoanhNghiep = req.session.user.id;
  const { tenHomestay, diaChi } = req.body;

  if (
    req.session.user.chucVu !== "Doanh Nghiệp" &&
    req.session.user.chucVu !== "Doanh Nhân"
  ) {
    return res
      .status(403)
      .json({ error: "Chỉ doanh nghiệp mới có thể thêm homestay!" });
  }

  if (!tenHomestay || !diaChi) {
    return res
      .status(400)
      .json({ error: "Tên và địa chỉ homestay là bắt buộc." });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO homestay (id, tenHomestay, diaChi) VALUES (?, ?, ?)`,
      [idDoanhNghiep, tenHomestay, diaChi]
    );

    res.status(201).json({
      message: "Thêm homestay thành công!",
      newHomestay: {
        idHomestay: result.insertId,
        id: idDoanhNghiep,
        tenHomestay,
        diaChi,
      },
    });
  } catch (err) {
    console.error("Lỗi /api/homestays:", err);
    res.status(500).json({ error: "Lỗi máy chủ khi thêm homestay." });
  }
});

// Lấy danh sách homestay
app.get("/api/my-homestays", requireLogin, async (req, res) => {
  const idDoanhNghiep = req.session.user.id;

  try {
    const [rows] = await db.execute(
      "SELECT * FROM homestay WHERE id = ? ORDER BY ngayTao DESC",
      [idDoanhNghiep]
    );
    res.json(rows);
  } catch (err) {
    console.error("Lỗi /api/my-homestays:", err);
    res.status(500).json({ error: "Lỗi máy chủ khi lấy danh sách homestay." });
  }
});

app.delete("/api/my-homestays/:idHomestay", requireLogin, async (req, res) => {
  try {
    const { idHomestay } = req.params;
    const idUser = req.session.user.id;

    const [check] = await db.execute(
      "SELECT * FROM homestay WHERE idHomestay = ? AND id = ?",
      [idHomestay, idUser]
    );

    if (check.length === 0) {
      return res.status(403).json({
        error:
          "Bạn không có quyền xóa homestay này hoặc homestay không tồn tại.",
      });
    }

    const [result] = await db.execute(
      "DELETE FROM homestay WHERE idHomestay = ?",
      [idHomestay]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Không tìm thấy homestay để xóa." });
    }

    res.status(200).json({ message: "Xóa homestay thành công!" });
  } catch (err) {
    console.error("Lỗi /api/my-homestays/:idHomestay (DELETE):", err);
    res.status(500).json({ error: "Lỗi máy chủ khi xóa homestay." });
  }
});

// Lấy danh sách phòng thuộc một homestay

app.get(
  "/api/my-homestays/:idHomestay/rooms",
  requireLogin,
  async (req, res) => {
    try {
      const { idHomestay } = req.params; // Lấy từ URL
      const maDoanhNghiep = req.session.user.id; // Lấy từ session

      const [check] = await db.execute(
        // Câu lệnh SQL kiểm tra cả 2 điều kiện
        "SELECT idHomestay FROM homestay WHERE idHomestay = ? AND id = ?",
        [idHomestay, maDoanhNghiep] // Phải khớp cả hai
      );

      if (check.length === 0) {
        return res.status(403).json({
          error:
            "Bạn không có quyền xem phòng của homestay này hoặc homestay không tồn tại.",
        });
      }

      const [rooms] = await db.execute(
        "SELECT * FROM phong WHERE idHomestay = ? ORDER BY tenPhong ASC",
        [idHomestay]
      );

      res.json(rooms); // Trả về danh sách phòng
    } catch (err) {
      console.error("Lỗi /api/my-homestays/:idHomestay/rooms:", err);
      res.status(500).json({ error: "Lỗi máy chủ khi lấy danh sách phòng." });
    }
  }
);
// Lấy danh sách phòng thuộc một homestay cụ thể

app.get(
  "/api/my-homestays/:idHomestay/rooms",
  requireLogin,
  async (req, res) => {
    try {
      const { idHomestay } = req.params;
      const idUser = req.session.user.id; // Lấy ID user từ session

      // Bước 1: Kiểm tra xem user này có sở hữu homestay này không
      // (Giống hệt logic của API DELETE)
      const [check] = await db.execute(
        "SELECT * FROM homestay WHERE idHomestay = ? AND id = ?",
        [idHomestay, idUser]
      );

      // Nếu không sở hữu hoặc homestay không tồn tại
      if (check.length === 0) {
        return res.status(403).json({
          error: "Bạn không có quyền xem phòng của homestay này.",
        });
      }

      // Bước 2: Nếu sở hữu, lấy tất cả các phòng của homestay đó
      // (Giả sử bảng của bạn tên là 'phong' và có cột 'idHomestay')
      const [rooms] = await db.execute(
        "SELECT * FROM phong WHERE idHomestay = ? ORDER BY tenPhong ASC",
        [idHomestay]
      );

      res.json(rooms); // Trả về danh sách phòng
    } catch (err) {
      console.error("Lỗi /api/my-homestays/:idHomestay/rooms:", err);
      res.status(500).json({ error: "Lỗi máy chủ khi lấy danh sách phòng." });
    }
  }
);
// Xóa user theo ID + xóa session của user đó
const requireAdmin = (req, res, next) => {
  if (!req.session?.user || req.session.user.chucVu !== "Admin") {
    return res.status(403).json({ message: "Chỉ admin mới xóa được!" });
  }
  next();
};

//LẤY CHI TIẾT HOMESTAY VÀ CÁC PHÒNG CỦA NÓ
app.get(
  "/api/my-homestays/:idHomestay/details",
  requireLogin,
  async (req, res) => {
    try {
      const { idHomestay } = req.params;
      const maDoanhNghiep = req.session.user.id; // Lấy ID doanh nghiệp từ session

      // Lấy chi tiết Homestay
      const [homestayCheck] = await db.execute(
        "SELECT * FROM homestay WHERE idHomestay = ? AND id = ?",
        [idHomestay, maDoanhNghiep]
      );

      if (homestayCheck.length === 0) {
        return res.status(403).json({
          error:
            "Bạn không có quyền xem homestay này hoặc homestay không tồn tại.",
        });
      }

      const homestayDetails = homestayCheck[0];

      //Lấy tất cả các phòng thuộc homestay này

      const [rooms] = await db.execute(
        "SELECT * FROM thongTinPhong WHERE idHomestay = ? ORDER BY tenPhong ASC",
        [idHomestay]
      );

      // Trả về dữ liệu theo cấu trúc { homestay, rooms }
      res.json({
        homestay: homestayDetails,
        rooms: rooms,
      });
    } catch (err) {
      console.error("Lỗi /api/my-homestays/:idHomestay/details:", err);
      res.status(500).json({ error: "Lỗi máy chủ khi lấy chi tiết homestay." });
    }
  }
);
app.delete("/users/:id", requireAdmin, async (req, res) => {
  // Thêm requireAdmin
  try {
    const { id } = req.params;

    const [userResult] = await db.execute("DELETE FROM users WHERE id = ?", [
      parseInt(id),
    ]);
    if (userResult.affectedRows === 0) {
      console.log("Không tìm thấy user để xóa:", id);
      return res.sendStatus(404);
    }

    await db.execute("DELETE FROM sessions WHERE data LIKE ?", [
      `%"id":${id}%`,
    ]);

    const [sessions] = await db.execute(
      "SELECT session_id, data FROM sessions"
    );
    for (let s of sessions) {
      try {
        const data = JSON.parse(s.data || "{}");
        if (data.user && data.user.id === parseInt(id)) {
          await db.execute("DELETE FROM sessions WHERE session_id = ?", [
            s.session_id,
          ]);
        }
      } catch (e) {
        // bỏ qua session lỗi
      }
    }

    if (req.session.user && req.session.user.id === parseInt(id)) {
      req.session.destroy(() => {
        res.clearCookie("session_cookie_name");
        return res.sendStatus(200);
      });
    } else {
      res.sendStatus(200);
    }
  } catch (err) {
    console.error("Lỗi /users/:id (DELETE):", err);
    res.sendStatus(500);
  }
});

// Cập nhật thông tin user
app.put("/users/:id", requireAdmin, async (req, res) => {
  // Thêm requireAdmin nếu cần
  try {
    const { id } = req.params;
    const { ho, ten, email, sdt, chucVu } = req.body;

    await db.execute(
      "UPDATE users SET ho=?, ten=?, email=?, sdt=?, chucVu=? WHERE id=?",
      [ho, ten, email, sdt, chucVu, id]
    );

    res.sendStatus(200);
  } catch (err) {
    console.error("Lỗi /users/:id (PUT):", err);
    res.sendStatus(500);
  }
});

// API: Lấy danh sách phòng, nhóm theo mã doanh nghiệp
app.get("/api/rooms-grouped-by-company", async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: "Chưa kết nối được với database." });
  }

  try {
    const sql = "SELECT * FROM thongTinPhong ORDER BY idHomestay ASC";
    const [results] = await db.execute(sql);

    const groupedData = results.reduce((acc, room) => {
      const idHomestay = room.idHomestay;
      const tenHomestay = room.tenHomestay || `Doanh nghiệp ${idHomestay}`;

      if (!acc[idHomestay]) {
        acc[idHomestay] = {
          idHomestay: idHomestay,
          tenHomestay,
          phong: [],
        };
      }

      acc[idHomestay].phong.push({
        maPhong: room.maPhong,
        tenPhong: room.tenPhong,
        hinhAnh: room.hinhAnh,
        diaChi: room.diaChi,
        loaiGiuong: room.loaiGiuong,
        gia: room.gia,
        soLuongKhach: room.soLuongKhach,
        tienIch: room.tienIch,
        giaKhungGio: room.giaKhungGio,
      });

      return acc;
    }, {});

    res.json(Object.values(groupedData));
  } catch (err) {
    console.error("Lỗi /api/rooms-grouped-by-company:", err);
    res.status(500).json({ error: "Lỗi truy vấn thông tin phòng" });
  }
});

// API: Lấy chi tiết 1 phòng theo maPhong
app.get("/api/rooms/:maPhong", async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: "Chưa kết nối được với database." });
  }

  try {
    const { maPhong } = req.params;
    const sql = "SELECT * FROM thongTinPhong WHERE maPhong = ?";
    const [results] = await db.execute(sql, [parseInt(maPhong)]);

    if (results.length === 0) {
      return res.status(404).json({ error: "Không tìm thấy phòng." });
    }

    const room = results[0];
    room.moTa =
      room.moTa ||
      `Phòng ${room.tenPhong} sang trọng tại ${room.diaChi}. Đầy đủ tiện nghi cho chuyến đi của bạn.`;

    res.json(room);
  } catch (err) {
    console.error("Lỗi /api/rooms/:maPhong:", err);
    res.status(500).json({ error: "Lỗi truy vấn phòng" });
  }
});

app.get("/api/filter-rooms", async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: "Chưa kết nối được với database." });
  }

  // 1. Lấy các tham số từ query string (ví dụ: /api/filter-rooms?location=Ninh Kiều&guests=2)
  const { location, guests, bedType, amenities, minPrice, maxPrice } =
    req.query;

  // 2. Bắt đầu câu SQL
  let sql = "SELECT * FROM thongTinPhong WHERE 1=1";
  const params = [];

  try {
    // 3. Xây dựng câu SQL động dựa trên tham số

    // Lọc theo Điểm đến (diaChi)
    if (location) {
      sql += " AND diaChi LIKE ?";
      params.push(`%${location}%`);
    }

    // Lọc theo Số lượng khách (soLuongKhach)
    if (guests) {
      sql += " AND soLuongKhach >= ?";
      params.push(parseInt(guests));
    }

    // Lọc theo Loại giường (loaiGiuong)
    if (bedType) {
      // Chuyển 'giuong-don' -> 'Giường đơn', 'giuong-doi' -> 'Giường đôi'
      const loaiGiuongDB =
        bedType === "giuong-don" ? "Giường đơn" : "Giường đôi";
      sql += " AND loaiGiuong = ?";
      params.push(loaiGiuongDB);
    }

    // Lọc theo Giá (gia)
    if (minPrice) {
      sql += " AND gia >= ?";
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      sql += " AND gia <= ?";
      params.push(parseFloat(maxPrice));
    }

    // Lọc theo Tiện ích (tienIch)
    if (amenities) {
      // Đảm bảo 'amenities' luôn là một mảng (nếu người dùng chọn nhiều)
      const amenitiesList = Array.isArray(amenities) ? amenities : [amenities];

      amenitiesList.forEach((item) => {
        // SỬA LỖI: Dùng LOWER() để truy vấn không phân biệt chữ hoa/thường
        // (Giá trị 'item' từ frontend đã là chữ thường, ví dụ: "bể bơi")
        sql += " AND LOWER(tienIch) LIKE ?";
        params.push(`%${item}%`); // 'item' đã là chữ thường rồi
      });
    }

    const [results] = await db.execute(sql, params);

    // 5. Trả về kết quả JSON
    res.json(results);
  } catch (err) {
    console.error("Lỗi /api/filter-rooms:", err);
    res.status(500).json({ error: "Lỗi máy chủ khi lọc phòng." });
  }
});

// Thêm đánh giá mới
app.post("/danhGia", async (req, res) => {
  const idNguoiDung = req.session?.user?.id;
  const { maPhong, danhGia, comment } = req.body;

  if (!idNguoiDung) {
    return res.status(401).json({ error: "Bạn phải đăng nhập để đánh giá!" });
  }

  try {
    await db.execute(
      "INSERT INTO danhgia (maPhong, idNguoiDung, danhGia, comment) VALUES (?, ?, ?, ?)",
      [maPhong, idNguoiDung, danhGia, comment]
    );
    res.status(201).json({ message: "Đánh giá đã được thêm." });
  } catch (err) {
    console.error("Lỗi /danhGia:", err);
    res.status(500).json({ error: "Lỗi máy chủ khi thêm đánh giá." });
  }
});

// Lấy danh sách người dùng đã đánh giá phòng
app.get("/danhGia/daDanhGia/:maPhong", async (req, res) => {
  const { maPhong } = req.params;

  try {
    const [rows] = await db.execute(
      "SELECT idNguoiDung FROM danhgia WHERE maPhong = ?",
      [maPhong]
    );

    res.json(rows);
  } catch (err) {
    console.error("Lỗi /danhGia/:maPhong:", err);
    res.status(500).json({ error: "Lỗi máy chủ khi lấy đánh giá." });
  }
});

// Kiểm tra người dùng đã đánh giá phòng chưa
app.get("/danhGia/kiemTra/:maPhong", async (req, res) => {
  const idNguoiDung = req.session?.user?.id;
  const { maPhong, danhGia, comment, created_at } = req.params;

  if (!idNguoiDung) {
    return res.status(401).json({ error: "Bạn phải đăng nhập!" });
  }

  try {
    const [rows] = await db.execute(
      "SELECT * FROM danhgia WHERE maPhong = ? AND idNguoiDung = ?",
      [maPhong, idNguoiDung]
    );

    if (rows.length > 0) {
      return res.json({ daDanhGia: true, review: rows[0] });
    }

    res.json({ daDanhGia: false });
  } catch (err) {
    console.error("Lỗi kiểm tra đánh giá:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

app.get("/api/reviews/:maPhong", async (req, res) => {
  if (!db) return res.status(500).json({ error: "DB error" });
  try {
    const { maPhong } = req.params;
    const sql = `
      SELECT u.ho as hoNguoiDung, u.ten as tenNguoiDung, d.created_at as review_date, d.danhGia as rating, d.comment as comment_text 
      FROM danhGia d 
      JOIN users u ON d.idNguoiDung = u.id 
      WHERE d.maPhong = ? 
      ORDER BY d.created_at DESC 
      LIMIT 10
    `;
    const [results] = await db.execute(sql, [parseInt(maPhong)]);
    res.json(results);
  } catch (err) {
    console.error("Lỗi API reviews:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// trung bình sao
app.get("/api/reviews-danhgia/:maPhong", async (req, res) => {
  if (!db) return res.status(500).json({ error: "DB not connected" });
  try {
    const { maPhong } = req.params;
    const [avgResult] = await db.execute(
      "SELECT COALESCE(AVG(danhGia), 0) as average_rating, COUNT(*) as total_count FROM danhGia WHERE maPhong = ?",
      [parseInt(maPhong)]
    );
    const average = parseFloat(avgResult[0].average_rating) || 5.0;
    const count = avgResult[0].total_count || 0;
    res.json({ average_rating: average.toFixed(1), total_count: count });
  } catch (err) {
    console.error("Lỗi API reviews-danhgia:", err.message);
    res.status(500).json({ error: "Query error: " + err.message });
  }
});

// Lịch sử đặt phòng]
app.get("/api/user/bookings", async (req, res) => {
  const userId = req.session?.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Bạn phải đăng nhập!" });
  }

  try {
    const [rows] = await db.execute(
      `SELECT 
        dp.id AS bookingId,
        dp.hoTen,
        tp.tenPhong,
        tp.tenHomestay,
        tp.hinhAnh,
        dp.ngayDat,
        dp.khungGio,
        dp.giaKhungGio,
        dp.soLuongKhach,
        dp.trangThai,
        dp.ngayTao,
        dp.ghiChu
       FROM datPhongTheoGio dp
       JOIN thongTinPhong tp ON dp.maPhong = tp.maPhong
       WHERE dp.idNguoiDung = ?
       ORDER BY dp.ngayTao DESC`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Lỗi /api/user/bookings:", err);
    res.status(500).json({ error: "Lỗi server" });
  }
});

//hủy đặt
app.put("/api/user/bookings/cancel/:id", async (req, res) => {
  console.log("Debug: Booking ID:", req.params.id); // ← Thêm
  const userId = req.session?.user?.id;
  const { id } = req.params;

  if (!userId) return res.status(401).json({ error: "Bạn chưa đăng nhập!" });

  try {
    const [check] = await db.execute(
      "SELECT * FROM datPhongTheoGio WHERE id = ? AND idNguoiDung = ?",
      [parseInt(id), userId]
    );

    if (check.length === 0) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy đặt phòng của bạn." });
    }
    if (check[0].trangThai === "daHuy" || check[0].trangThai === "hoanTat") {
      return res.status(400).json({ error: "Không thể hủy đặt phòng này." });
    }

    await db.execute(
      "UPDATE datPhongTheoGio SET trangThai = 'daHuy' WHERE id = ?",
      [id]
    );

    res.json({ message: "Hủy đặt phòng thành công!" });
  } catch (err) {
    console.error("Lỗi hủy đặt phòng:", err);
    res.status(500).json({ error: "Lỗi server khi hủy đặt phòng" });
  }
});
// Check user đăng nhập
app.get("/current_user", async (req, res) => {
  if (!req.session.user) return res.sendStatus(401);

  try {
    const [rows] = await db.execute(
      "SELECT id, ho, ten, gioiTinh, ngaySinh, email, sdt, chucVu FROM users WHERE id = ?",
      [req.session.user.id]
    );

    if (rows.length === 0) {
      req.session.destroy(() => {});
      return res.sendStatus(401);
    }

    const user = rows[0];
    res.json({
      user: {
        id: user.id,
        ho: user.ho,
        ten: user.ten,
        ngaySinh: user.ngaySinh,
        gioiTinh: user.gioiTinh,
        hoTen: `${user.ho} ${user.ten}`,
        email: user.email,
        sdt: user.sdt,
        chucVu: user.chucVu,
      },
    });
  } catch (err) {
    console.error("Lỗi /current_user:", err);
    res.sendStatus(500);
  }
});

// API: Thống kê cho Admin
app.use(async (req, res, next) => {
  try {
    await db.execute(
      "UPDATE dashboard_admin SET tongLuotXem = tongLuotXem + 1 WHERE id = 1"
    );
  } catch (err) {
    console.error("Không thể tăng lượt truy cập:", err);
  }
  next();
});

app.get("/api/admin/stats", requireLogin, async (req, res) => {
  try {
    if (req.session.user.chucVu !== "Admin") {
      return res.status(403).json({ error: "Không có quyền truy cập" });
    }

    const [doanhNghiep] = await db.execute(
      "SELECT COUNT(*) AS total FROM users WHERE chucVu = 'Doanh Nghiệp'"
    );

    const [users] = await db.execute(
      "SELECT COUNT(*) AS total FROM users WHERE chucVu = 'Người Dùng'"
    );

    const [views] = await db.execute(
      "SELECT tongLuotXem FROM dashboard_admin WHERE id = 1"
    );

    const [
      [roomsRows, roomsFields],
      [homestaysRows, hsFields],
      [bookingsRows, bkFields],
      [recentBookingsRows, rbFields],
      [recentHomestaysRows, rhFields],
      [doanhNghiepByMonthRows, dnFields],
      [usersByMonthRows, uFields],
    ] = await Promise.all([
      db.execute("SELECT COUNT(*) AS total FROM thongTinPhong"),
      db.execute("SELECT COUNT(*) AS total FROM homestay"),
      db.execute("SELECT COUNT(*) AS total FROM datPhongTheoGio"),

      db.execute(`SELECT hoTen, sdt, ngayDat, khungGio, ngayTao 
                  FROM datPhongTheoGio 
                  ORDER BY ngayTao DESC LIMIT 5`),

      db.execute(`SELECT tenHomestay, diaChi, ngayTao
                  FROM homestay 
                  ORDER BY ngayTao DESC LIMIT 5`),

      db.execute(`SELECT MONTH(ngayTao) AS month, COUNT(*) AS total
                  FROM users WHERE chucVu = 'Doanh Nghiệp'
                  GROUP BY MONTH(ngayTao)`),

      db.execute(`SELECT MONTH(ngayTao) AS month, COUNT(*) AS total
                  FROM users WHERE chucVu = 'Người Dùng'
                  GROUP BY MONTH(ngayTao)`),
    ]);

    res.json({
      doanhNghiep: doanhNghiep[0].total,
      nguoiDung: users[0].total,
      views: views[0].tongLuotXem,
      rooms: roomsRows[0].total,
      homestays: homestaysRows[0].total,
      bookings: bookingsRows[0].total,
      recentBookings: recentBookingsRows,
      recentHomestays: recentHomestaysRows,
      doanhNghiepByMonth: doanhNghiepByMonthRows,
      usersByMonth: usersByMonthRows,
    });
  } catch (err) {
    console.error("Lỗi API /api/admin/stats:", err);
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
});

// API: Thong kê cho Businessman
app.get("/api/doanhnghiep/stats", requireLogin, async (req, res) => {
  try {
    const idDN = req.session.user.id; // ID doanh nghiệp

    // --- Tổng doanh thu ---
    const [doanhThu] = await db.execute(
      `
  SELECT SUM(d.giaKhungGio) AS total
  FROM datPhongTheoGio d
  JOIN thongTinPhong p ON d.maPhong = p.maPhong
  WHERE p.maDoanhNghiep = ?
    AND d.trangThai = 'daXacNhan'
  `,
      [idDN]
    );

    // --- Lịch đặt mới trong hôm nay ---
    const [lichMoi] = await db.execute(
      `
      SELECT COUNT(*) AS total
      FROM datPhongTheoGio d
      JOIN thongTinPhong p ON d.maPhong = p.maPhong
      WHERE p.maDoanhNghiep = ? 
        AND DATE(d.ngayTao) = CURDATE()
    `,
      [idDN]
    );

    // --- Tổng phòng thuộc doanh nghiệp ---
    const [tongPhong] = await db.execute(
      `
      SELECT COUNT(*) AS total
      FROM thongTinPhong 
      WHERE maDoanhNghiep = ?
    `,
      [idDN]
    );

    // --- Tổng số phòng đang sử dụng (đã xác nhận & trong hôm nay) ---
    const [dangSuDung] = await db.execute(
      `
      SELECT COUNT(*) AS total
      FROM datPhongTheoGio d
      JOIN thongTinPhong p ON d.maPhong = p.maPhong
      WHERE p.maDoanhNghiep = ?
        AND d.trangThai = 'daXacNhan'
        AND d.ngayDat = CURDATE()
    `,
      [idDN]
    );

    // --- Đã đặt trước (đặt cho ngày mai trở đi) ---
    const [datTruoc] = await db.execute(
      `
      SELECT COUNT(*) AS total
      FROM datPhongTheoGio d
      JOIN thongTinPhong p ON d.maPhong = p.maPhong
      WHERE p.maDoanhNghiep = ?
        AND d.ngayDat > CURDATE()
        AND d.trangThai = 'daXacNhan'
    `,
      [idDN]
    );

    // --- Phòng trống ---
    const phongTrong =
      tongPhong[0].total - dangSuDung[0].total - datTruoc[0].total;

    // --- Hoạt động gần đây ---
    const [activity] = await db.execute(
      `
      SELECT d.hoTen, d.ngayDat, d.khungGio, d.ngayTao
      FROM datPhongTheoGio d
      JOIN thongTinPhong p ON d.maPhong = p.maPhong
      WHERE p.maDoanhNghiep = ?
      ORDER BY d.ngayTao DESC
      LIMIT 3
    `,
      [idDN]
    );

    // --- Số khách theo từng tháng ---
    const [guestsMonth] = await db.execute(
      `
      SELECT MONTH(ngayDat) AS month, COUNT(*) AS total
      FROM datPhongTheoGio d
      JOIN thongTinPhong p ON d.maPhong = p.maPhong
      WHERE p.maDoanhNghiep = ?
      GROUP BY MONTH(ngayDat)
      ORDER BY MONTH(ngayDat)
    `,
      [idDN]
    );

    // --- Doanh thu theo từng tháng ---
    const [revenueMonth] = await db.execute(
      `
  SELECT 
      MONTH(d.ngayDat) AS month, 
      SUM(d.giaKhungGio) AS total
  FROM datPhongTheoGio d
  JOIN thongTinPhong p ON d.maPhong = p.maPhong
  WHERE p.maDoanhNghiep = ?
    AND d.trangThai = 'daXacNhan'
  GROUP BY MONTH(d.ngayDat)
  ORDER BY MONTH(d.ngayDat)
  `,
      [idDN]
    );

    // --- Đặt phòng theo tháng ---
    const [bookingsMonth] = await db.execute(
      `
      SELECT MONTH(ngayDat) AS month,
             SUM(CASE WHEN trangThai = 'daXacNhan' THEN 1 ELSE 0 END) AS booked,
             SUM(CASE WHEN trangThai = 'daHuy' THEN 1 ELSE 0 END) AS canceled
      FROM datPhongTheoGio d
      JOIN thongTinPhong p ON d.maPhong = p.maPhong
      WHERE p.maDoanhNghiep = ?
      GROUP BY MONTH(ngayDat)
      ORDER BY MONTH(ngayDat)
    `,
      [idDN]
    );

    res.json({
      doanhThu: doanhThu[0].total,
      lichMoi: lichMoi[0].total,
      tongPhong: tongPhong[0].total,
      dangSuDung: dangSuDung[0].total,
      datTruoc: datTruoc[0].total,
      phongTrong: phongTrong,
      activity,
      guestsMonth,
      revenueMonth: revenueMonth.map((r) => ({
        month: r.month,
        total: r.total ? Number(r.total) : 0,
      })),
      bookingsMonth,
    });
  } catch (err) {
    console.log("Lỗi API /api/doanhnghiep/stats:", err);
    res.status(500).json({ error: "Lỗi máy chủ" });
  }
});

app.use(bookingRouter);
/// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server đang chạy ở http://localhost:${PORT}`)
);
