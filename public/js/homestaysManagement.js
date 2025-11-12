document.addEventListener("DOMContentLoaded", async function () {
  function createHomestayCard(homestay) {
    const statusMap = {
      choXacNhan: { text: "Chờ xác nhận", class: "status-pending" },
      daXacNhan: { text: "Đã xác nhận", class: "status-confirmed" },
      daHuy: { text: "Đã hủy", class: "status-cancelled" },
    };

    const status = statusMap[homestay.trangThai] || {
      text: homestay.trangThai,
      class: "",
    };
    const showActions = homestay.trangThai === "choXacNhan";
    return `
            <div class="booking-card" data-booking-id="${homestay.id}">
                <div class="booking-header">
                    <div>
                        <h3 style="margin: 0; color: #2c3e50;">${
                          homestay.tenPhong
                        }</h3>
                        <small style="color: #7f8c8d;">${
                          booking.tenHomestay
                        }</small>
                    </div>
                    <span class="booking-status ${
                      status.class
                    }">${status.text}</span>
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
                        <span><strong>Số khách:</strong> ${
                          booking.soLuongKhach
                        } người</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-money-bill-wave"></i>
                        <span class="price-highlight">${formatPrice(
                          booking.giaKhungGio
                        )}đ</span>
                    </div>
                </div>
                
                ${
                  booking.ghiChu
                    ? `
                    <div class="info-item" style="margin-top: 10px;">
                        <i class="fas fa-sticky-note"></i>
                        <span><strong>Ghi chú:</strong> ${booking.ghiChu}</span>
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
});
