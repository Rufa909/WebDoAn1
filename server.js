require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");
const path = require("path");
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Kết nối DB
let db;
(async () => {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    console.log("Kết nối db thành công!");
  } catch (err) {
    console.error("lỗi kết nối db:", err);
  }
})();
// Route đăng ký
app.post("/register", async (req, res) => {
  const { ho, ten, email, sdt, ngaySinh, gioiTinh, matKhau, xacNhanmatKhau } =
    req.body;

  if (matKhau !== xacNhanmatKhau) {
    return res.sendStatus(401);
  }
  try {
    // Kiểm tra email tồn tại
    const [existing] = await db.execute("SELECT id FROM users WHERE email=?", [
      email,
    ]);
    if (existing.length > 0) {
      return res.sendStatus(409);
    }

    // Mã hoá mật khẩu
    const hashedPassword = await bcrypt.hash(matKhau, 10);

    // Lưu vào DB
    const [result] = await db.execute(
      "INSERT INTO users (ho, ten, email, sdt, ngaySinh, gioiTinh, matKhau) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [ho, ten, email, sdt, ngaySinh, gioiTinh, hashedPassword]
    );

    res.sendStatus(201);
  } catch (err) {
    console.error("Lỗi /register:", err);
    res.status(500).send({ error: err.message });
  }
});

// Route đăng nhập
app.post("/login", async (req, res) => {
  const { email, matKhau } = req.body;

  try {
    const [results] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (results.length === 0) {
      return res.sendStatus(401); // Email không tồn tại
    }

    const user = results[0];
    const match = await bcrypt.compare(matKhau, user.matKhau);

    if (!match) {
      return res.sendStatus(401); // Mật khẩu sai
    }
    res.sendStatus(200); // Đăng nhập thành công
  } catch (err) {
    console.error("Lỗi /login:", err);
    res.status(500); // Lỗi server
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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server đang chạy ở http://localhost:${PORT}`)
);
