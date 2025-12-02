// File: /js/my-homestays.js

document.addEventListener("DOMContentLoaded", () => {
  const gridContainer = document.getElementById("homestay-grid-container");

  async function fetchAndDisplayHomestays() {
    try {
      const response = await fetch("/api/my-homestays"); // API bạn đã có
      if (!response.ok) {
        throw new Error("Không thể tải danh sách homestay.");
      }
      const homestays = await response.json();
      const approved = homestays.filter((h) => h.trangThai === "daDuyet");

      if (homestays.length === 0) {
        alert(
          "Bạn chưa đăng ký homestay nào. Vui lòng đăng ký thông tin homestay trước."
        );
        window.location.href = "setting.html";
        // Chuyển đến trang setting
        return;
      }

      gridContainer.innerHTML = ""; // Xóa "Đang tải..."

      if (approved.length === 0) {
        alert("Chưa có homestay nào được duyệt.");
        return;
      }

      // Tạo card cho mỗi homestay
      approved.forEach((homestay) => {
        const card = document.createElement("div");
        card.className = "homestay-card";

        card.innerHTML = `
                    <p> <h3> Tên: ${
                      homestay.tenHomestay || "Chưa đặt tên"
                    }</h3></p>
                    <small> <strong>Địa chỉ:</strong> ${
                      homestay.diaChi || "Chưa có địa chỉ"
                    }</small>
                    
                `;

        // Khi click, chuyển sang trang roomdiagram.html
        card.addEventListener("click", () => {
          // Chuyển người dùng đến trang "roomdiagram.html"
          // và "gửi" idHomestay qua URL
          window.location.href = `roomdiagram.html?idHomestay=${homestay.idHomestay}`;
        });

        gridContainer.appendChild(card);
      });
    } catch (err) {
      console.error(err);
      gridContainer.innerHTML = `<p style="color: red;">${err.message}</p>`;
    }
  }

  fetchAndDisplayHomestays();
});
