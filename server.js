require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");
const path = require("path");
const app = express();

const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);

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
// Route đăng ký
app.post("/register", async (req, res) => {
  const { ho, ten, email, sdt, ngaySinh, gioiTinh, matKhau, xacNhanmatKhau, chucVu } =
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
      "INSERT INTO users (ho, ten, email, sdt, ngaySinh, gioiTinh, matKhau, chucVu) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [ho, ten, email, sdt, ngaySinh, gioiTinh, hashedPassword, chucVu || "Người Dùng"]
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
      return res.sendStatus(401); // Email không tồn tại
    }

    const user = results[0];
    const match = await bcrypt.compare(matKhau, user.matKhau);

    if (!match) {
      return res.sendStatus(401); // Mật khẩu sai
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
    };
    // console.log("Đăng nhập thành công:", req.session.user);
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
    await db.execute("UPDATE users SET matKhau = ? WHERE email = ?", [hashedPassword, email]);
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

// Check user đăng nhập
app.get("/current_user", async (req, res) => {
  if (!req.session.user) return res.sendStatus(401);
  
  try {
    const [rows] = await db.execute("SELECT id FROM users WHERE id = ?", [
      req.session.user.id,
    ]);
    if (rows.length === 0) {
      req.session.destroy(() => {});
      return res.sendStatus(401);
    }

    res.json({ user: req.session.user });
  } catch (err) {
    console.error("Lỗi /current_user:", err);
    res.sendStatus(500);
  }
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



// Xóa user theo ID + xóa session của user đó
const requireAdmin = (req, res, next) => {
  if (!req.session?.user || req.session.user.chucVu !== "Admin") {
    return res.status(403).json({ message: "Chỉ admin mới xóa được!" });
  }
  next();
};

app.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [userResult] = await db.execute("DELETE FROM users WHERE id = ?", [parseInt(id)]);
    if (userResult.affectedRows === 0) {
      console.log("Không tìm thấy user để xóa:", id);
      return res.sendStatus(404);
    }

    await db.execute("DELETE FROM sessions WHERE data LIKE ?", [`%"id":${id}%`]);

    const [sessions] = await db.execute("SELECT session_id, data FROM sessions");
    for (let s of sessions) {
      try {
        const data = JSON.parse(s.data || "{}");
        if (data.user && data.user.id === parseInt(id)) {
          await db.execute("DELETE FROM sessions WHERE session_id = ?", [s.session_id]);
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
app.put("/users/:id", async (req, res) => {
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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server đang chạy ở http://localhost:${PORT}`)
);
