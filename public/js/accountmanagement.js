document.addEventListener("DOMContentLoaded", async () => {
  const tbody = document.querySelector("tbody");
  const res = await fetch("/users", {
    credentials: "include",
  });

  const users = await res.json();

  tbody.innerHTML = users
    .map(
      (u) => `
      <tr>
        <td>${u.ho} ${u.ten}</td>
        <td>${u.email}</td>
        <td>${u.sdt || ""}</td>
        <td>
          <span class="role-badge ${
            u.chucVu === "Admin" ? "role-owner" : "role-full"
          }">${u.chucVu}</span>
        </td>
        <td class="action-buttons" style="text-align: center">
        <button class="edit-btn" data-id="${
          u.id
        }" style="background-color: #3b82f6; color: white; border: none; padding: 12px 17px; border-radius: 5px; cursor: pointer;">
            <i class="fas fa-pen"></i>
          </button>
        <button class="delete-btn" data-id="${
          u.id
        }" style="background-color: #ef4444; color: white; border: none; padding: 12px 25px; border-radius: 5px; cursor: pointer;">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
      </tr>`
    )
    .join("");

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      Swal.fire({
        title: "Xác nhận?",
        text: "Bạn có chắc muốn xóa tài khoản này?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
        backdrop: true,
      }).then(async (result) => {
        if (result.isConfirmed) {
          const id = btn.dataset.id;
          try {
            const delRes = await fetch(`/users/${id}`, {
              method: "DELETE",
              credentials: "include",
            });
            console.log("Delete status:", delRes.status); // Debug
            if (delRes.ok) {
              Swal.fire({
                icon: "success",
                title: "Thành công",
                text: "Đã xóa!",
                backdrop: true,
              });
              setTimeout(() => {
                location.reload();
              }, 1000);
            } else {
              let errorMsg = `Lỗi ${delRes.status}`;
              try {
                const errorData = await delRes.json();
                errorMsg = errorData.message || errorMsg;
              } catch {}
              Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: errorMsg,
                backdrop: true,
              });
            }
          } catch (err) {
            console.error("Delete error:", err);
            Swal.fire({
              icon: "error",
              title: "Lỗi kết nối",
              text: "Không thể xóa.",
              backdrop: true,
            });
          }
        }
      });
    });
  });

  // JavaScript để mở/đóng popup
  const openBtn = document.getElementById("openPopupBtn");
  const popup = document.getElementById("themTaiKhoan");
  const closeBtn = document.getElementById("closePopupBtn");
  const closeSpan = document.getElementsByClassName("close")[0];
  const addForm = document.getElementById("add_form");
  const editForm = document.getElementById("edit_form");

  openBtn.onclick = function () {
    popup.style.display = "block";
  };

  closeBtn.onclick = function () {
    popup.style.display = "none";
  };

  closeSpan.onclick = function () {
    popup.style.display = "none";
  };

  window.onclick = function (event) {
    if (event.target == popup) {
      popup.style.display = "none";
    }
  };

  if (addForm) {
    addForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;

      const ho = document.getElementById("ho")?.value?.trim();
      const ten = document.getElementById("ten")?.value?.trim();
      const email = document.getElementById("email")?.value?.trim();
      const sdt = document.getElementById("sdt")?.value?.trim();
      const ngaySinh = document.getElementById("ngaySinh")?.value;
      const gioiTinh = document.getElementById("gioiTinh")?.value;
      const matKhau = document.getElementById("matKhau")?.value;
      const vaiTro = document.getElementById("vaiTro")?.value?.trim();

      if (!ho || !ten || !email || !matKhau || !vaiTro || vaiTro === "") {
        Swal.fire({
          icon: "warning",
          title: "Cảnh báo",
          text: "Vui lòng điền đầy đủ họ, tên, email, mật khẩu và vai trò!",
          backdrop: true,
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Email không hợp lệ!",
          backdrop: true,
        });
        return;
      }

      const validVaiTro = ["Admin", "Doanh Nghiệp", "Người Dùng"];
    let finalVaiTro = validVaiTro.includes(vaiTro) ? vaiTro : "Người Dùng";
    console.log("Vai trò final gửi:", finalVaiTro);  // Log debug

      const data = {
        ho,
        ten,
        email,
        sdt,
        ngaySinh,
        gioiTinh,
        matKhau,
        xacNhanmatKhau: matKhau,
        chucVu: finalVaiTro,
      };

      console.log("Data gửi:", data);

      try {
        const res = await fetch("/register", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        let errorMsg = "Lỗi không xác định";
        if (!res.ok) {
          try {
            const errorData = await res.json();
            errorMsg = errorData.message || `Lỗi ${res.status}`;
          } catch {
            errorMsg = `Lỗi ${res.status}`;
          }
        }

        if (res.status === 201) {
          Swal.fire({
            icon: "success",
            title: "Thành công",
            text: "Bạn đã tạo tài khoản thành công",
            backdrop: true,
          });
          form.reset();
          popup.style.display = "none";
          setTimeout(() => location.reload(), 1500);
        } else if (res.status === 400) {
          Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: "Vui lòng điền đủ thông tin!",
            backdrop: true,
          });
        } else if (res.status === 409) {
          Swal.fire({
            icon: "info",
            title: "Lỗi",
            text: "Email đã tồn tại!",
            backdrop: true,
          });
        } else {
          // Handle các status khác (404, 500, etc.)
          Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: errorMsg,
            backdrop: true,
          });
        }
      } catch (err) {
        console.error("Fetch error:", err); // Debug log
        Swal.fire({
          icon: "error",
          title: "Lỗi kết nối",
          text: "Không thể kết nối tới server. Kiểm tra console để xem chi tiết.",
          backdrop: true,
        });
      }
    });
  } else {
    console.error("không tìm thấy! Kiểm tra HTML.");
  }

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const user = users.find((u) => u.id == id);

      const newHo = prompt("Họ:", user.ho);
      const newTen = prompt("Tên:", user.ten);
      const newEmail = prompt("Email:", user.email);
      const newSdt = prompt("Số điện thoại:", user.sdt);
      const newChucVu = prompt(
        "Chức vụ (Admin / Người Dùng / Doanh Nghiệp):",
        user.chucVu
      );

      if (newHo && newTen && newEmail) {
        const putRes = await fetch(`/users/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ho: newHo,
            ten: newTen,
            email: newEmail,
            sdt: newSdt,
            chucVu: newChucVu,
          }),
        });
        if (putRes.ok) {
          alert("Cập nhật thành công!");
          location.reload();
        } else {
          alert("Cập nhật thất bại!");
        }
      }
    });
  });
});
