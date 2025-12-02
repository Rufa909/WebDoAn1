
function redirectToBooking(roomId) {
  const id = parseInt(roomId, 10);
  if (isNaN(id) || id <= 0) {
    alert("Mã phòng không hợp lệ!");
    return;
  }
  window.location.href = `RoomDetail.html?room_id=${id}`;
}
document.addEventListener("DOMContentLoaded", () => {
  // --- 1. LẤY CÁC PHẦN TỬ VÀ THAM SỐ TỪ URL ---
  const resultsContainer = document.getElementById("homestay-results");

  const params = new URLSearchParams(window.location.search);

  const amenitiesIconMap = {
    "be boi": "fa-swimming-pool",
    "view dep": "fa-rainbow",
    "phong gym": "fa-dumbbell",
    "may chieu": "fa-film",
    "bep": "fa-utensils",
    "bon tam": "fa-bath",
    "ban cong": "fa-cloud",
  };
  function displayHomestays(homestaysToDisplay) {
    if (!resultsContainer) {
      console.error("Lỗi: Không tìm thấy phần tử #homestay-results.");
      return;
    }

    // Nếu không có kết quả từ API
    if (homestaysToDisplay.length === 0) {
      resultsContainer.innerHTML =
        '<p class="fs-5 text-muted text-center">Rất tiếc, không có homestay nào phù hợp với lựa chọn của bạn.</p>';
      return;
    }

    
    const cardsHTML = homestaysToDisplay
      .map((room) => {
        // Xử lý danh sách tiện ích
        const amenitiesList = (room.tienIch || "")
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item);

        const amenitiesHTML = amenitiesList
          .map((text) => {
            // Chuyển "Bể bơi" -> "be boi" để làm key
            const key = text
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace("đ", "d");
              

            const icon = amenitiesIconMap[key] || "fa-star";
            return `<span class="amenity"><i class="fa-solid ${icon}"></i> ${text}</span>`;
            
            
   
          })
          .join("");

        // HTML thẻ card
        return `
                <div class="col-lg-4 col-md-6 mb-4">
                    <div class="card h-100 shadow-sm border-0 room-card">
                        <img src="/${
                          room.hinhAnh
                        }" class="card-img-top room-image" alt="${
          room.tenPhong
        }">
                        <div class="card-body d-flex flex-column room-info">
                            <h3 class="room-name">${room.tenPhong}</h3>
                            <h5 class="room-price mt-auto">
                                ${new Intl.NumberFormat("vi-VN").format(
                                  room.giaKhungGio
                                )} VNĐ/giờ
                            </h5>
                            

                            <div class="amenities mb-3">
                                <span class="amenity"><i class="fa-solid fa-users"></i> ${
                                  room.soLuongKhach
                                } người</span>
                                <span class="amenity"><i class="fa-solid fa-bed"></i> ${
                                  room.loaiGiuong
                                }</span>
                            </div>

                            <div class="amenities mb-3">
                                ${amenitiesHTML}
                            </div>
                             <p class="card-text text-muted mb-2">
                                <i class="fa-solid fa-location-dot"></i> ${
                                  room.diaChi
                                }
                            </p>   
                            
                            <button class="btn btn-datphong" onclick="redirectToBooking(${room.maPhong})"> Đặt phòng
                            </button>
                        </div>
                    </div>
                </div>
            `;
      })
      .join("");

    resultsContainer.innerHTML = cardsHTML;
  }

  // --- 4. LOGIC LỌC CHÍNH (GỌI API) ---
  async function fetchFilteredHomestays() {
    try {
      // Biến params (từ bước 1) chứa tất cả tham số
      // params.toString() sẽ là "location=Ninh+Ki%E1%BB%81u&guests=2"

      //  GỌI API MỚI ĐÃ TẠO TRONG SERVER.JS
      const response = await fetch(`/api/filter-rooms?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Lỗi HTTP: ${response.status}`);
      }

      const filteredHomestays = await response.json();

      // 5. KHỞI TẠO HIỂN THỊ
      // Gửi dữ liệu JSON vừa nhận được từ API vào hàm hiển thị
      displayHomestays(filteredHomestays);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu lọc:", error);
      resultsContainer.innerHTML =
        '<p class="text-center fs-5 text-danger col-12">Đã xảy ra lỗi khi tải kết quả. Vui lòng thử lại.</p>';
    }
  }

  // Gọi hàm fetch ngay khi trang được tải
  fetchFilteredHomestays();
});
