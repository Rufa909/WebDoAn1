<?php
$conn = new mysqli("localhost", "root", "", "webdoan1");
if ($conn->connect_error) {
    die("Kết nối thất bại: " . $conn->connect_error);
}
?>