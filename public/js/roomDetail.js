const API_BASE_URL = "http://localhost:3000";

const amenitiesIconMap = {
  tv: "fa-tv",
  tulanh: "fa-snowflake",
  beboi: "fa-swimming-pool",
  viewdep: "fa-rainbow",
  phonggym: "fa-dumbbell",
  maychieu: "fa-film",
  bancong: "fa-cloud",
  maygiat: "fa-water",
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
    return `<div class="amenity-item"><i class="fa-solid ${icon}"></i><span>${text}</span></div>`;
  });

  return itemsHtml.join(""); // Return string để innerHTML
}

let currentImageIndex = 0;
const images = [
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200",
  "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200",
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200",
];

// Ẩn controls nếu chỉ có 1 ảnh
// function checkImageCount() {
//     const mainImages = document.querySelectorAll('.main-image');
//     const imageCount = mainImages.length;

//     if (imageCount <= 1) {
//         // Ẩn gallery controls (nút prev/next)
//         const galleryControls = document.querySelector('.gallery-controls');
//         if (galleryControls) {
//             galleryControls.style.display = 'none';
//         }

//         // Ẩn gallery navigation (dots)
//         const galleryNav = document.querySelector('.gallery-nav');
//         if (galleryNav) {
//             galleryNav.style.display = 'none';
//         }

//         // Ẩn thumbnail gallery
//         const thumbnailGallery = document.querySelector('.thumbnail-gallery');
//         if (thumbnailGallery) {
//             thumbnailGallery.style.display = 'none';
//         }

//         // Dừng auto slide
//         if (autoSlideInterval) {
//             clearInterval(autoSlideInterval);
//         }
//     }
// }

// checkImageCount();

function showImage(index) {
  currentImageIndex = index;

  // Update main images
  const mainImages = document.querySelectorAll(".main-image");
  mainImages.forEach((img, i) => {
    img.classList.toggle("active", i === index);
  });

  // Update dots
  const dots = document.querySelectorAll(".gallery-dot");
  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
  });

  // Update thumbnails
  const thumbnails = document.querySelectorAll(".thumbnail");
  thumbnails.forEach((thumb, i) => {
    thumb.classList.toggle("active", i === index);
  });
}

// Auto slide every 5 seconds
// let autoSlideInterval = setInterval(nextImage, 5000);

// // Pause on hover
// const imageGallery = document.getElementById('imageGallery');
// if (imageGallery) {
//     imageGallery.addEventListener('mouseenter', function() {
//         clearInterval(autoSlideInterval);
//     });

//     imageGallery.addEventListener('mouseleave', function() {
//         autoSlideInterval = setInterval(nextImage, 5000);
//     });
// }

// ========== STICKY SIDEBAR ==========
window.addEventListener("scroll", handleStickyCards);
window.addEventListener("resize", handleStickyCards);

function handleStickyCards() {
  const bookingCard = document.querySelector(".booking-card");
  const sidebar = document.querySelector(".sidebar");
  const contentGrid = document.querySelector(".content-grid");

  if (!bookingCard || !sidebar || !contentGrid) return;

  // Only on desktop
  if (window.innerWidth <= 768) {
    bookingCard.classList.remove("sticky", "bottom");
    return;
  }

  const sidebarRect = sidebar.getBoundingClientRect();
  const contentGridRect = contentGrid.getBoundingClientRect();
  const scrollY = window.scrollY;

  const startSticky = contentGridRect.top + scrollY;
  const endSticky =
    startSticky + contentGridRect.height - bookingCard.offsetHeight - 40;

  const currentScroll = scrollY + 20;

  // Remove classes
  bookingCard.classList.remove("sticky", "bottom");

  if (currentScroll >= startSticky && currentScroll < endSticky) {
    bookingCard.classList.add("sticky");
  } else if (currentScroll >= endSticky) {
    bookingCard.classList.add("bottom");
  }
}

// Initial call
handleStickyCards();

document.addEventListener("DOMContentLoaded", async () => {
  // Parse room_id
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("room_id");
  if (!roomId) return; // Giữ hardcode nếu không có ID

  try {
    const response = await fetch(`../api/rooms/${roomId}`);
    if (!response.ok) throw new Error(`Lỗi API: ${response.status}`);
    const room = await response.json();
    console.log("Phòng từ DB:", room);

    // Ghi đè Title Section
    document.querySelector(".location span").textContent =
      room.diaChiChiTiet + " " + room.diaChi;

    // Ghi đè tên phòng
    document.querySelector(".homestay-title").textContent = room.tenPhong;
    document.querySelector(
      ".homestay-subtitle"
    ).innerHTML = `<i class="fa-solid fa-house" style="color: #606366;"></i> ${room.tenHomestay}`;

    // Ghi đè giá
    const formattedPrice = new Intl.NumberFormat("vi-VN").format(room.giaKhungGio);
    const formattedPriceTimeSlot = new Intl.NumberFormat("vi-VN").format(room.gia);
    document.querySelector(
      ".price"
    ).innerHTML = `${formattedPrice} VNĐ <span class="price-unit">/3 giờ</span>`;
    

    document.querySelector(
      ".total-row span:last-child"
    ).innerHTML = `${formattedPrice} VNĐ`;
    document.querySelector(
      "#tongTien span:last-child"
    ).innerHTML = `${formattedPrice} VNĐ`;

    // Image
    const imageGallery = document.getElementById("imageGallery");
    imageGallery.innerHTML = `<div class="room-image" style="background-image: url('/${room.hinhAnh}'); background-size: cover; height: 400px;"></div>`;

    // Amenities (clear rồi append)
    const amenitiesGrid = document.querySelector(".amenities-grid");
    amenitiesGrid.innerHTML = createAmenitiesHtml(room); // Ghi đè toàn bộ grid

    // Description (ghi đè cả 2 p)
    const descEls = document.querySelectorAll(".description");
    descEls.forEach((el, index) => {
      el.textContent = room.moTa; // Fallback nếu DB rỗng
    });

    // Info Phòng
    const infoValues = document.querySelectorAll(".info-value");
    if (infoValues[0]) infoValues[0].textContent = room.soLuongKhach;
    if (infoValues[2]) infoValues[2].textContent = room.loaiGiuong;

    // Đánh giá
    const stars = document.querySelectorAll(".rating-container span");
    const soSao = document.getElementById("ratingValue");

    stars.forEach((star) => {
      star.addEventListener("click", function () {
        const danhGia = this.getAttribute("data-value");
        soSao.value = danhGia;

        // reset tất cả sao về rỗng
        stars.forEach((s) => {
          s.querySelector("i").classList.remove("fa-solid");
          s.querySelector("i").classList.add("fa-regular");
        });

        // tô vàng đến sao được nhấn
        stars.forEach((s) => {
          if (s.getAttribute("data-value") <= danhGia) {
            s.querySelector("i").classList.remove("fa-regular");
            s.querySelector("i").classList.add("fa-solid");
          }
        });
      });
    });
    // guiDanhGia
    document
      .getElementById("submitReview")
      .addEventListener("click", async () => {
        const danhGia = soSao.value;
        const binhLuan = document.getElementById("reviewComment").value;

        const resDanhGia = await fetch(`/danhGia/kiemTra/${roomId}`, {
          credentials: "include",
        });
        const data = await resDanhGia.json();

        if (data.daDanhGia) {
          Swal.fire({
            icon: "error",
            title: "Thông báo",
            text: "Bạn đã đánh giá phòng này rồi.",
          });
        } else {
          if (parseInt(danhGia) === 0) {
            Swal.fire({
              icon: "warning",
              title: "Thông báo",
              text: "Vui lòng chọn số sao mà bạn muốn đánh giá.",
            });
            return;
          }

          const res = await fetch("/danhGia", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              maPhong: roomId,
              danhGia: danhGia,
              comment: binhLuan,
            }),
          });

          if (res.status === 401) {
            Swal.fire({
              icon: "warning",
              title: "Thông báo",
              text: "Bạn cần đăng nhập để đánh giá!",
            });
            window.location.href = "/pages/login.html";
            return;
          }

          if (res.ok) {
            Swal.fire({
              icon: "success",
              title: "Thông báo",
              text: "Đánh giá thành công",
            });
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            Swal.fire({
              icon: "error",
              title: "Thông báo",
              text: "Có lỗi xảy ra!",
            });
          }
        }
      });

    // Danh sách đánh giá
    try {
      const resReviews = await fetch(`../api/reviews/${roomId}`);
      if (resReviews.ok) {
        const reviews = await resReviews.json();
        console.log("Reviews từ DB:", reviews.length); // Check số lượng

        const reviewsSection = document.querySelector(".reviews-section");
        if (reviewsSection && reviews.length > 0) {
          // Update count
          const reviewsH2 = reviewsSection.querySelector("h2");
          reviewsH2.innerHTML = `<i class="fa-solid fa-star" style = "color: #FFD43B"></i> Đánh Giá (${reviews.length})`;

          // Clear all existing .review-item (xóa 3 hardcode)
          const existingItems = reviewsSection.querySelectorAll(".review-item");
          existingItems.forEach((item) => item.remove());

          // Append all reviews as dãy (loop full)
          reviews.forEach((review) => {
            const newItem = document.createElement("div");
            newItem.className = "review-item";
            const starsHtml = Array.from({ length: 5 }, (_, i) =>
              i < review.rating
                ? '<i class="fa-solid fa-star"></i>'
                : '<i class="fa-regular fa-star"></i>'
            ).join("");
            const dateFormatted = new Date(
              review.review_date
            ).toLocaleDateString("vi-VN");
            const hoNguoiDung = review.hoNguoiDung;
            const tenNguoiDung = review.tenNguoiDung;
            newItem.innerHTML = `
        <div class="review-header">
          <span class="reviewer-name">${hoNguoiDung} ${tenNguoiDung}</span>
          <span class="review-date">${dateFormatted}</span>
        </div>
        <div class="review-rating">${starsHtml}</div>
        <p class="review-text">${review.comment_text || "No comment"}</p>
      `;
            reviewsSection.appendChild(newItem); // Append để thành dãy
          });
        }
      }

      const resRating = await fetch(`/api/reviews-danhgia/${roomId}`);
      if (resRating.ok) {
        const ratingData = await resRating.json();

        const average = parseFloat(ratingData.average_rating) || 5.0;
        const count = ratingData.total_count || 0;

        // Show span text
        const ratingSpan = document.querySelector(".rating span");
        if (ratingSpan)
          ratingSpan.textContent = `${average.toFixed(1)} (${count} đánh giá)`;

        // Render stars dynamic
        const ratingDiv = document.querySelector(".rating");
        if (ratingDiv) {
          const fullStars = Math.floor(average);
          const hasHalf = average % 1 >= 0.5;
          const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

          let starsHtml = "";
          for (let i = 0; i < fullStars; i++)
            starsHtml += '<i class="fa-solid fa-star"></i>';
          if (hasHalf)
            starsHtml += '<i class="fa-solid fa-star-half-stroke"></i>';
          for (let i = 0; i < emptyStars; i++)
            starsHtml += '<i class="fa-regular fa-star"></i>';

          ratingDiv.innerHTML =
            starsHtml +
            `<span style="color: #333; margin-left: 10px;">${average.toFixed(
              1
            )} (${count} đánh giá)</span>`;
        }
      } else {
        console.error("Lỗi fetch rating:", resRating.status);
      }
    } catch (error) {
      console.error("Lỗi load reviews:", error);
    }

    // Booking Button onclick (ghi đè event)
    const bookingBtn = document.querySelector(".booking-btn");
    bookingBtn.onclick = async (e) => {
      const resCurrent = await fetch("/current_user", {
        credentials: "include",
      });
      if (!resCurrent.ok) {
        Swal.fire({
          icon: "warning",
          title: "Thông báo",
          text: "Vui lòng đăng nhập để đặt phòng!",
        });
        return;
      } else {
        e.preventDefault();
        window.location.href = `../pages/booking.html?room_id=${roomId}`; // Redirect với ID
      }
    };
  } catch (error) {
    console.error("Lỗi load phòng:", error);
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
