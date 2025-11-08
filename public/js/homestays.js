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

          if (homestays.length === 0) {alert("Bạn chưa đăng ký homestay nào. Vui lòng đăng ký thông tin homestay trước.");
             window.location.href = "setting.html"; 
            // Chuyển đến trang setting 
            return; }

            gridContainer.innerHTML = ""; // Xóa "Đang tải..."

            // Tạo card cho mỗi homestay
            homestays.forEach(homestay => {
                const card = document.createElement("div");
                card.className = "homestay-card";
                
                card.innerHTML = `
                    <h3> Mã Homestay: ${homestay.idHomestay}</h3>
                    <p> <h4> Tên: ${homestay.tenHomestay || "Chưa đặt tên"}</h4></p>
                    <small> Địa chỉ: ${homestay.diaChi || "Chưa có địa chỉ"}</small>
                    
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