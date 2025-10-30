document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");
  
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const form = e.target;

      const data = {
        email: document.getElementById("email").value,
        matKhau: document.getElementById("matKhau").value,
      };

      try {
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
            window.location.replace("/index.html");
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
  }

  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();

      if (!email) {
        return Swal.fire({
          icon: "warning",
          title: "Thiếu thông tin",
          text: "Vui lòng nhập email trước.",
        });
      }

      try {
        const res = await fetch("/checkEmail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (res.status === 200) {
          Swal.fire({
            icon: "success",
            title: "Email hợp lệ",
            text: "Nhập mật khẩu mới bên dưới.",
          });

          document.getElementById("form-change").innerHTML = `
            <label for="matKhau">Mật khẩu mới</label>
            <div class="input-wrapper">
              <input type="password" id="matKhau" name="matKhau" required placeholder="Nhập mật khẩu mới">
              <button type="button" class="password-toggle" onclick="togglePassword()">Hiện</button>
            </div>
          `;
          const tiepTucBtn = document.getElementById("tiepTucBtn");
          tiepTucBtn.innerText = "Đặt lại mật khẩu";

          const newBtn = tiepTucBtn.cloneNode(true);
          tiepTucBtn.parentNode.replaceChild(newBtn, tiepTucBtn);

          newBtn.addEventListener("click", async function (e) {
            e.preventDefault();
            const newPassword = document.getElementById("matKhau").value.trim();

            if (!newPassword) {
              return Swal.fire({
                icon: "warning",
                title: "Thiếu thông tin",
                text: "Vui lòng nhập mật khẩu mới.",
              });
            }

            try {
              const res2 = await fetch("/forgotPassword", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, matKhau: newPassword }),
              });

              if (res2.status === 200) {
                Swal.fire({
                  icon: "success",
                  title: "Thành công",
                  text: "Mật khẩu đã được đặt lại. Vui lòng đăng nhập.",
                });
                setTimeout(() => {
                  window.location.replace("/pages/login.html");
                }, 1500);
              } else {
                Swal.fire({
                  icon: "error",
                  title: "Thất bại",
                  text: "Không thể đặt lại mật khẩu. Thử lại sau.",
                });
              }
            } catch (err) {
              Swal.fire({
                icon: "error",
                title: "Lỗi kết nối",
                text: "Không thể kết nối tới server.",
              });
            }
          });
        } else if (res.status === 404) {
          Swal.fire({
            icon: "error",
            title: "Thất bại",
            text: "Email không tồn tại trong hệ thống.",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Lỗi server",
            text: "Không thể kiểm tra email. Thử lại sau.",
          });
        }
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Lỗi kết nối",
          text: "Không thể kết nối tới server.",
        });
      }
    });
  }
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
