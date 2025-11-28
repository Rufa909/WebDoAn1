document.addEventListener("DOMContentLoaded", function () {
  const API_BASE_URL = "http://localhost:3000";
  let allBookings = [];
  let currentFilter = "all";

  async function getCurrentUser() {
    try {
      const response = await fetch(`${API_BASE_URL}/current_user`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        return data.user;
      }

      alert("Vui lòng đăng nhập để tiếp tục");
      window.location.href = "/pages/login.html";
      return null;
    } catch (error) {
      console.error("Lỗi kiểm tra đăng nhập:", error);
      return null;
    }
  }

  async function loadBookings() {
    const user = await getCurrentUser();
    if (!user) return;

    if (user.chucVu !== "Doanh Nghiệp") {
      alert("Bạn không có quyền truy cập trang này");
      window.location.href = "/";
      return;
    }

    const loadingEl = document.getElementById("loadingContainer");
    const containerEl = document.getElementById("booking-grid-container");

    loadingEl.style.display = "block";
    containerEl.innerHTML = "";

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/booking/business/${user.id}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Lỗi tải dữ liệu");
      }

      allBookings = data.bookings;
      renderBookings();
      updateNotificationBadge();
    } catch (error) {
      console.error("Lỗi load bookings:", error);
      containerEl.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Lỗi tải dữ liệu</h3>
                    <p>${error.message}</p>
                </div>
            `;
    } finally {
      loadingEl.style.display = "none";
    }
  }

  function renderBookings() {
    const containerEl = document.getElementById("booking-grid-container");
    const searchTerm = document
      .getElementById("searchInput")
      .value.toLowerCase();

    let filteredBookings = allBookings;

    if (currentFilter !== "all") {
      filteredBookings = filteredBookings.filter(
        (b) => b.trangThai === currentFilter
      );
    }

    if (searchTerm) {
      filteredBookings = filteredBookings.filter(
        (b) =>
          b.hoTen.toLowerCase().includes(searchTerm) ||
          b.sdt.includes(searchTerm) ||
          b.tenPhong.toLowerCase().includes(searchTerm)
      );
    }

    if (filteredBookings.length === 0) {
      containerEl.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <h3>Không có đặt phòng nào</h3>
                    <p>Chưa có yêu cầu đặt phòng ${
                      currentFilter !== "all" ? "trong danh mục này" : ""
                    }</p>
                </div>
            `;
      return;
    }

    containerEl.innerHTML = filteredBookings
      .map((booking) => createBookingCard(booking))
      .join("");

    attachEventListeners();
  }

  // Tạo card booking
  function createBookingCard(booking) {
    const statusMap = {
      choXacNhan: { text: "Chờ xác nhận", class: "status-pending" },
      daXacNhan: { text: "Đã xác nhận", class: "status-confirmed" },
      daHuy: { text: "Đã hủy", class: "status-cancelled" },
    };

    const status = statusMap[booking.trangThai] || {
      text: booking.trangThai,
      class: "",
    };
    const showActions = booking.trangThai === "choXacNhan";

    
    let surchargeText = '';
    let updatedGhiChu = booking.ghiChu || '';  // Sao chép ghiChu gốc để chỉnh sửa
    if (updatedGhiChu.includes('[Phụ thu]')) {
      const match = updatedGhiChu.match(/\[Phụ thu\] (\d+) người thừa/);
      if (match) {
        surchargeText = `(phụ thu ${match[1]} người)`;
        
        updatedGhiChu = updatedGhiChu.replace(/\[Phụ thu\] \d+ người thừa x \d+k = [\d.]+đ/, '').trim();
        if (updatedGhiChu === '') updatedGhiChu = null;  
      }
    }
    

    return `
      <div class="booking-card" data-booking-id="${booking.id}">
        <div class="booking-header">
          <div>
            <h3 style="margin: 0; color: #2c3e50;">${booking.tenPhong}</h3>
            <small style="color: #7f8c8d;">${booking.tenHomestay}</small>
          </div>
          <span class="booking-status ${status.class}">${status.text}</span>
        </div>
        
        <div class="time-slot-info">
          <i class="fas fa-calendar-day"></i> 
          <strong>${formatDate(booking.ngayDat)}</strong> - 
          <i class="fas fa-clock"></i> 
          <strong>${booking.khungGio}</strong>
        </div>
        
        <div class="booking-info">
          <div class="info-item">
            <i class="fas fa-user"></i>
            <span><strong>Khách:</strong> ${booking.hoTen}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-phone"></i>
            <span><strong>SĐT:</strong> ${booking.sdt}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-users"></i>
            <span><strong>Số khách:</strong> ${booking.soLuongKhach} người <span class="surcharge-highlight">${surchargeText}</span></span>
          </div>
          <div class="info-item">
            <i class="fas fa-money-bill-wave"></i>
            <span class="price-highlight">${formatPrice(booking.giaKhungGio)}đ</span>
          </div>
        </div>
        
        ${
          updatedGhiChu
            ? `
        <div class="info-item" style="margin-top: 10px;">
          <i class="fas fa-sticky-note" style="color: #3498db;"></i>
          <span><strong>Ghi chú khách:</strong> ${updatedGhiChu}</span>
        </div>
      `
            : ""
        }

        ${
          booking.lyDoTuChoi
            ? `
        <div class="info-item" style="margin-top: 10px; background: #ffebee; padding: 8px; border-radius: 6px; border-left: 4px solid #e74c3c;">
          <i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i>
          <span><strong>Lý do từ chối:</strong> ${booking.lyDoTuChoi}</span>
        </div>
      `
            : ""
        }
        
        <div class="info-item" style="margin-top: 5px; font-size: 12px; color: #999;">
          <i class="fas fa-clock"></i>
          <span>Đặt lúc: ${formatDateTime(booking.ngayTao)}</span>
        </div>
        
        ${
          showActions
            ? `
            <div class="booking-actions">
              <button class="btn-confirm" data-id="${booking.id}">
                <i class="fas fa-check"></i> Xác nhận
              </button>
              <button class="btn-reject" data-id="${booking.id}">
                <i class="fas fa-times"></i> Từ chối
              </button>
            </div>
        `
            : ""
        }
      </div>
    `;
  }

  function attachEventListeners() {
    document.querySelectorAll(".btn-confirm").forEach((btn) => {
      btn.addEventListener("click", async function () {
        const bookingId = this.dataset.id;
        if (confirm("Xác nhận đặt phòng này?")) {
          await confirmBooking(bookingId);
        }
      });
    });

    // Nút từ chối
    document.querySelectorAll(".btn-reject").forEach((btn) => {
      btn.addEventListener("click", async function () {
        const bookingId = this.dataset.id;
        const reason = prompt("Lý do từ chối (không bắt buộc):");
        if (reason !== null) {
          await rejectBooking(bookingId, reason);
        }
      });
    });
  }

  // Xác nhận booking
  async function confirmBooking(bookingId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/booking/confirm/${bookingId}`,
        {
          method: "PUT",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Lỗi xác nhận booking");
      }

      alert("✓ Đã xác nhận đặt phòng thành công!");
      await loadBookings();
    } catch (error) {
      console.error("Lỗi xác nhận:", error);
      alert("Lỗi: " + error.message);
    }
  }

  // Từ chối booking
  async function rejectBooking(bookingId, reason) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/booking/reject/${bookingId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ lyDoTuChoi: reason }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Lỗi từ chối booking");
      }

      alert("✓ Đã từ chối đặt phòng");
      await loadBookings();
    } catch (error) {
      console.error("Lỗi từ chối:", error);
      alert("Lỗi: " + error.message);
    }
  }

  // Cập nhật số thông báo
  function updateNotificationBadge() {
    const pendingCount = allBookings.filter(
      (b) => b.trangThai === "choXacNhan"
    ).length;
    document.getElementById("notificationBadge").textContent = pendingCount;
  }

  // Format giá
  function formatPrice(price) {
    return new Intl.NumberFormat("vi-VN").format(price);
  }

  // Format ngày
  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN");
  }

  // Format ngày giờ
  function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString("vi-VN");
  }

  // Xử lý filter tabs
  document.querySelectorAll(".filter-tab").forEach((tab) => {
    tab.addEventListener("click", function () {
      document
        .querySelectorAll(".filter-tab")
        .forEach((t) => t.classList.remove("active"));
      this.classList.add("active");
      currentFilter = this.dataset.status;
      renderBookings();
    });
  });

  // Xử lý search
  document.getElementById("searchInput").addEventListener("input", function () {
    renderBookings();
  });

  // Xử lý notification panel
  const openBtn = document.getElementById("open-notification-panel");
  const closeBtn = document.getElementById("close-panel-btn");
  const panel = document.getElementById("notification-panel");
  const overlay = document.getElementById("overlay");

  function openPanel() {
    const pendingBookings = allBookings.filter(
      (b) => b.trangThai === "choXacNhan"
    );
    const panelBody = document.getElementById("notification-panel-body");

    if (pendingBookings.length === 0) {
      panelBody.innerHTML =
        '<p style="text-align: center; color: #999; padding: 20px;">Không có thông báo mới</p>';
    } else {
      panelBody.innerHTML = pendingBookings
        .map(
          (b) => `
                <div class="notification-item" style="padding: 15px; border-bottom: 1px solid #f0f0f0;">
                    <div style="display: flex; gap: 10px;">
                        <div style="flex-shrink: 0;">
                            <i class="fas fa-bell" style="color: #f39c12; font-size: 20px;"></i>
                        </div>
                        <div style="flex: 1;">
                            <p style="margin: 0 0 5px 0;"><strong>${
                              b.hoTen
                            }</strong> đặt phòng <strong>${
            b.tenPhong
          }</strong></p>
                            <p style="margin: 0; font-size: 13px; color: #666;">
                                ${formatDate(b.ngayDat)} - ${b.khungGio}
                            </p>
                            <p style="margin: 5px 0 0 0; font-size: 12px; color: #999;">
                                ${formatDateTime(b.ngayTao)}
                            </p>
                        </div>
                    </div>
                </div>
            `
        )
        .join("");
    }

    panel.classList.add("open");
    overlay.classList.add("show");
  }

  function closePanel() {
    panel.classList.remove("open");
    overlay.classList.remove("show");
  }

  if (openBtn) openBtn.addEventListener("click", openPanel);
  if (closeBtn) closeBtn.addEventListener("click", closePanel);
  if (overlay) overlay.addEventListener("click", closePanel);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && panel.classList.contains("open")) {
      closePanel();
    }
  });

  // Load dữ liệu ban đầu
  loadBookings();

  
  

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