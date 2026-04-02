# Alibaba Homestay

## Giới thiệu
**Alibaba Homestay** là hệ thống hỗ trợ quản lý và đặt phòng homestay trực tuyến. 
Ứng dụng giúp người dùng tìm kiếm, đặt phòng và quản lý thông tin homestay một cách nhanh chóng và thuận tiện.
Hệ thống cũng hỗ trợ quản trị viên quản lý phòng, khách hàng và các đơn đặt phòng.

## Mục tiêu của dự án
- Xây dựng hệ thống đặt phòng homestay đơn giản
- Quản lý thông tin phòng và khách hàng
- Hỗ trợ đặt phòng trực tuyến
- Quản lý lịch đặt phòng

## Chức năng chính

### Người dùng
- Đăng ký tài khoản
- Đăng nhập hệ thống
- Xem danh sách homestay
- Xem chi tiết phòng
- Đặt phòng
- Xem lịch sử đặt phòng

### Quản trị viên
- Quản lý phòng
- Thêm / sửa / xóa homestay
- Quản lý người dùng
- Quản lý đơn đặt phòng

## Công nghệ sử dụng
- HTML
- CSS
- JavaScript
- Node.js & Express
- MySQL

## Tác giả
Trần Quang Huy (Rufa909)
Huỳnh Thiện Phúc (Phuc0110205)
Triệu Thị Hoàng Nhung ()

Khi code xong dùng:
git add .
git commit -m "nội dung bạn thay đổi"
git push origin main

Trước khi vào code:
git pull origin main (để lấy source code của người đã upload trước đó về rồi code)

" node -v ": version của node.js
" npm -v ": version của package nodejs
" npm init -y ": add package
" npm install express ": install node modules (express)

" npm install mysql2 ": install MySQL
" npm install express dotenv ": Quản lý biến môi trường
" npm install bcrypt ": Mã hóa mật khẩu
" npm install --save-dev nodemon ": Cài đặt nodemon và lưu vào mục devDependencies
" npm install sweetalert2 ": thư viện Sweetaler2 hỗ trợ popup
" npm install nodemailer ": xác thực mail
" npm install express-session express-mysql-session ": thư viện session để lưu user đăng nhập


" npm run devStart ": chạy thử server với dạng public
