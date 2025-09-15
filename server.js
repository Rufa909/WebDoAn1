require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const path = require('path');
const app = express();

// Middleware đọc JSON body
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// Kết nối MySQL
let Pool_db;
(async () => {
  Pool_db = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
})();

app.post('/register', async (req, res) => {
    const { hovaten, matkhau, email } = req.body;

    if (!hovaten || !matkhau || !email) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
    }
    try {
        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(matkhau, 10);
        // Lưu thông tin người dùng vào cơ sở dữ liệu
        const [result] = await Pool_db.execute(
            'INSERT INTO users (hovaten, matkhau, email) VALUES (?, ?, ?)',
            [hovaten, hashedPassword, email]
        );
        res.status(201).json({ message: 'Đăng ký thành công!', userId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi máy chủ. Vui lòng thử lại sau.', error: error.message});
    }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'register.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chạy ở http://localhost:${PORT}`));