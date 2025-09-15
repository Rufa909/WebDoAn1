require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const mysql = require("mysql2");
const path = require("path");
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Pool MySQL
const Pool_db = mysql
  .createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })
  .promise();

// Route đăng ký
app.post("/register", async (req, res) => {
  const { hovaten, matkhau, xacnhanmatkhau, email } = req.body;

  if (!hovaten || !matkhau || !email || !xacnhanmatkhau) {
    return res.sendStatus(400);
  }

  if (matkhau !== xacnhanmatkhau) {
        return res.sendStatus(401);
    }
  try {
    // Kiểm tra email tồn tại
    const [existing] = await Pool_db.execute(
      "SELECT id FROM users WHERE email=?",
      [email]
    );
    if (existing.length > 0) {
      return res.sendStatus(409);
    }

    // Mã hoá mật khẩu
    const hashedPassword = await bcrypt.hash(matkhau, 10);

    // Lưu vào DB
    const [result] = await Pool_db.execute(
      "INSERT INTO users (hovaten, matkhau, email) VALUES (?, ?, ?)",
      [hovaten, hashedPassword, email]
    );

    res.sendStatus(201);
  } catch (err) {
    console.error(err);
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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chạy ở http://localhost:${PORT}`));
