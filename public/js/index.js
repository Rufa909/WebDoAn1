const API_BASE_URL = "http://localhost:3000";

function formatPrice(price) {
  if (typeof price !== "number") return "N/A";
  return new Intl.NumberFormat("vi-VN").format(price);
}

function redirectToBooking(roomId) {
  // Kiểm tra tính hợp lệ của mã phòng
  const id = parseInt(roomId);
  if (isNaN(id) || id <= 0) {
    console.error("Mã phòng không hợp lệ:", roomId);
    alert("Lỗi: Không tìm thấy mã phòng.");
    return;
  }

  const bookingUrl = `pages/RoomDetail.html?room_id=${id}`;
  window.location.href = bookingUrl;
}

function showBranch(branchId) {
  const sections = document.querySelectorAll(".enterprise-block");
  const buttons = document.querySelectorAll(".branch-btn");

  buttons.forEach((btn) => btn.classList.remove("active"));

  const clickedButton = document.querySelector(
    `.branch-btn[onclick*="${branchId}"]`
  );
  if (clickedButton) {
    clickedButton.classList.add("active");
  }

  sections.forEach((section) => {
    const homestayName = section
      .querySelector(".address-header")
      .textContent.toLowerCase()
      .replace(/\s/g, "-");

    if (branchId === "all" || homestayName.includes(branchId)) {
      section.style.display = "block";
      section.style.animation = "fadeIn 0.5s ease-in-out";
    } else {
      section.style.display = "none";
    }
  });
}

function showFilter() {
  document.getElementById("filterBox").style.display = "block";
}

function hideFilter() {
  document.getElementById("filterBox").style.display = "none";
}

const amenitiesIconMap = {
  beboi: "fa-swimming-pool",
  viewdep: "fa-rainbow",
  phonggym: "fa-dumbbell",
  maychieu: "fa-film",
  bancong: "fa-cloud",
  bep: "fa-utensils",
  bontam: "fa-bath",
};

function createAmenitiesHtml(room) {
  const amenitiesText =
    room.tienIch ||
    "Bể bơi, Bếp, Bồn tắm, Máy chiếu, Phòng gym, Ban công, View đẹp";
  const amenitiesList = amenitiesText.split(",");
  const itemsHtml = amenitiesList.map((item) => {
    const text = item.trim();
    if (!text) return "";
    const key = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace("đ", "d")
      .replace(/\s/g, "");
    const icon = amenitiesIconMap[key] || "fa-check-circle";
    return `<li><i class="fa-solid ${icon}"></i> ${text}</li>`;
  });

  itemsHtml.push(`<li><i class="fa-solid fa-bed"></i> ${room.loaiGiuong}</li>`);
  itemsHtml.push(
    `<li><i class="fa-solid fa-users"></i> ${room.soLuongKhach} khách</li>`
  );

  return `<ul class="room-amenities">${itemsHtml.join("")}</ul>`;
}

function createRoomCardHtml(room, homestayName) {
  const imageUrl = `/${room.hinhAnh}`;
  const amenities = createAmenitiesHtml(room);

  return `
        <div class="card room-card">
            <div class="room-image" style="background-image: url('${imageUrl}')"></div>
            <div class="card-body">
                <h5 class="card-title">${room.tenPhong} - ${homestayName}</h5>
                
                <p class="room-price">
                    ${new Intl.NumberFormat("vi-VN").format(room.gia)} VNĐ/ 3 giờ
                </p>
                ${amenities}
                
                <button class="btn btn-datphong" onclick="redirectToBooking(${
                  room.maPhong
                })">
                    Đặt phòng
                </button>
                
            </div>
        </div>`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const style = document.createElement("style");
  style.textContent = `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bounceIn { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.1); opacity: 0.8; } 70% { transform: scale(0.9); opacity: 0.9; } 100% { transform: scale(1); opacity: 1; } }
    `;
  document.head.appendChild(style);

  const filterBox = document.getElementById("filterBox");
  const filterForm = document.getElementById("filterForm");
  const closeFilterBtn = document.getElementById("closeFilterBtn");

  if (filterBox) {
    filterBox.style.display = "none";
  }

  function toggleFilter() {
    if (filterBox) {
      const isVisible = filterBox.style.display === "block";
      filterBox.style.display = isVisible ? "none" : "block";
    }
  }

  // Gắn sự kiện filter
  if (closeFilterBtn) closeFilterBtn.addEventListener("click", toggleFilter);

  if (filterForm) {
    filterForm.addEventListener("click", (e) => {
      if (
        e.target.tagName === "BUTTON" &&
        e.target.closest(".filter-options")
      ) {
        const button = e.target;
        const parentSection = button.closest(".filter-section");
        const isMultiSelect = parentSection
          .querySelector("h5")
          .innerText.includes("Tiện ích");

        button.blur();

        if (!isMultiSelect) {
          if (button.classList.contains("active")) {
            button.classList.remove("active");
          } else {
            parentSection
              .querySelectorAll(".btn.active")
              .forEach((b) => b.classList.remove("active"));
            button.classList.add("active");
          }
        } else {
          button.classList.toggle("active");
        }
      }
    });

    filterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const params = new URLSearchParams();
      filterForm
        .querySelectorAll("[data-location].active")
        .forEach((btn) => params.append("location", btn.dataset.location));
      filterForm
        .querySelectorAll("[data-guests].active")
        .forEach((btn) => params.append("guests", btn.dataset.guests));
      filterForm
        .querySelectorAll("[data-bed-type].active")
        .forEach((btn) => params.append("bedType", btn.dataset.bedType));
      filterForm
        .querySelectorAll("[data-amenity].active")
        .forEach((btn) => params.append("amenities", btn.dataset.amenity));
      const minPrice = document.getElementById("min-price").value;
      const maxPrice = document.getElementById("max-price").value;

      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);

      window.location.href = `/pages/results.html?${params.toString()}`;
    });

    filterForm.addEventListener("reset", () => {
      filterForm
        .querySelectorAll(".btn.active")
        .forEach((b) => b.classList.remove("active"));
    });
  }

  document.querySelectorAll(".room-card").forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-10px) scale(1.02)";
    });

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0) scale(1)";
    });
  });

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/rooms-grouped-by-company`
    );
    if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);

    const groupedData = await response.json();
    let finalHtml = "";

    const homestaySectionsEl = document.getElementById("homestay-sections");
    if (!homestaySectionsEl)
      throw new Error("Không tìm thấy container #homestay-sections");

    for (const doanhNghiep of groupedData) {
      const homestayName = doanhNghiep.tenHomestay;

      const roomsHtml = doanhNghiep.phong
        .map((room) => createRoomCardHtml(room, homestayName))
        .join("");
      finalHtml += `
                <div class="enterprise-block" data-branch="${doanhNghiep.tenHomestay
                  .toLowerCase()
                  .replace(/\s/g, "-")}">
                    <h3 class="address-header">${doanhNghiep.tenHomestay}</h3>
                    <div class="scroll-container">
                        <div class="rooms-grid">${roomsHtml}</div>
                    </div>
                </div>
            `;
    }

    homestaySectionsEl.innerHTML = finalHtml;
  } catch (error) {
    console.error("Lỗi khi tải phòng:", error);
    document.getElementById(
      "homestay-sections"
    ).innerHTML = `<p class="text-danger text-center">Không thể tải dữ liệu phòng. Kiểm tra API: ${API_BASE_URL}/api/rooms-grouped-by-company</p>`;
  }

  // btn cuộn lên trang đầu
  const scrollToTopBtn = document.getElementById("scrollToTop");

  window.addEventListener("scroll", function () {
    if (window.pageYOffset > 100) {
      scrollToTopBtn.classList.add("show");
    } else {
      scrollToTopBtn.classList.remove("show");
    }
  });

  scrollToTopBtn.addEventListener("click", function (e) {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
});
