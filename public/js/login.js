document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const form = e.target;

    const data = {
      email: document.getElementById("email").value,
      matKhau: document.getElementById("matKhau").value,
    };

    try{
      const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status == 200) {
        Swal.fire({
          icon: "success",
          title: "Thành công",
          text: "Bạn đã đăng nhập thành công",
          backdrop: true,
        });
        setTimeout(() => {
          window.location.replace('/index.html');
        }, 1000);
      } else if (res.status == 401) {
        Swal.fire({
          icon: "error",
          title: "Đăng nhập thất bại",
          text: "Email hoặc mật khẩu không đúng.",
          backdrop: true,
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Lỗi kết nối",
        text: "Không thể kết nối tới server.",
        backdrop: true,
      });
    }
  });
});


function togglePassword() {
  const passwordInput = document.getElementById("matKhau");
  const toggleBtn = document.querySelector(".password-toggle");

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    toggleBtn.textContent = "Ẩn";
  } else {
    passwordInput.type = "password";
    toggleBtn.textContent = "Hiện";
  }
}
