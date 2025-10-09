document.addEventListener("DOMContentLoaded", async () => {
  const tbody = document.querySelector("tbody");
  const res = await fetch("/users");
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
            u.chucVu === "admin" ? "role-owner" : "role-full"
          }">${u.chucVu}</span>
        </td>
        <td class="action-buttons" style="text-align: right">
          <button class="delete-btn" data-id="${u.id}" title="Xóa">
            <i class="fas fa-trash-alt"></i>
          </button>
          <button class="edit-btn" data-id="${u.id}">
            <i class="fas fa-pen"></i> Sửa
          </button>
        </td>
      </tr>`
    )
    .join("");

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (confirm("Bạn có chắc muốn xóa tài khoản này?")) {
        const id = btn.dataset.id;
        const delRes = await fetch(`/users/${id}`, { method: "DELETE" });
        if (delRes.ok) {
          alert("Đã xóa thành công!");
          location.reload();
        } else {
          alert("Xóa thất bại!");
        }
      }
    });
  });

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const user = users.find((u) => u.id == id);

      const newHo = prompt("Họ:", user.ho);
      const newTen = prompt("Tên:", user.ten);
      const newEmail = prompt("Email:", user.email);
      const newSdt = prompt("Số điện thoại:", user.sdt);
      const newChucVu = prompt("Chức vụ (admin / nguoiDung):", user.chucVu);

      if (newHo && newTen && newEmail) {
        const putRes = await fetch(`/users/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
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
