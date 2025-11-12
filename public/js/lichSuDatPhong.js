document.addEventListener("DOMContentLoaded", async function () {
  const listContainer = document.getElementById("bookingsList");
  listContainer.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...</div>`;

  try {
    const res = await fetch("/api/user/bookings");
    if (res.status === 401) {
      listContainer.innerHTML = `<p>Vui lòng đăng nhập để xem lịch sử đặt phòng.</p>`;
      return;
    }

    const bookings = await res.json();
    listContainer.innerHTML = "";

    if (bookings.length === 0) {
      listContainer.innerHTML = `<p>Bạn chưa có lịch sử đặt phòng.</p>`;
      return;
    }

    bookings.forEach((bk) => {
      let statusClass = "";
      switch (bk.trangThai) {
        case "choXacNhan":
          statusClass = "status-pending";
          break;
        case "daXacNhan":
          statusClass = "status-confirmed";
          break;
        case "hoanTat":
          statusClass = "status-completed";
          break;
      }

      listContainer.innerHTML += `
        <div class="booking-card">
          <div class="booking-header">
            <div class="booking-title">${bk.tenHomestay} - ${bk.tenPhong}</div>
            <span class="booking-status status-${bk.trangThai}">
              ${mapStatus(bk.trangThai)}
            </span>
          </div>

          <div class="booking-info">
            <div class="info-item"><i class="fa-solid fa-calendar"></i> Ngày đặt: ${formatDate(
              bk.ngayDat
            )}</div>
            <div class="info-item"><i class="fa-solid fa-clock"></i> Khung giờ: ${
              bk.khungGio
            }</div>
            <div class="info-item"><i class="fa-solid fa-users"></i> ${
              bk.soLuongKhach
            } khách</div>
            ${
              bk.trangThai === "daHuy"
                ? `<div class="info-item"><i class="fa-solid fa-user"></i> Lý do: ${bk.ghiChu}</div>`
                : ""
            }
            
          </div>

          <div class="booking-price">${bk.giaKhungGio.toLocaleString()} VNĐ</div>

          <div class="booking-actions">
        ${
          (bk.trangThai === "choXacNhan")
            ? `<button class="action-btn btn-danger btn-cancel-booking" data-id="${bk.bookingId}">
              Hủy đặt phòng
            </button>`
            : ""
        }
      </div>
        </div>
      `;
    });
  } catch (err) {
    console.error(err);
    listContainer.innerHTML = `<p>Lỗi tải dữ liệu.</p>`;
  }

  document.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("btn-cancel-booking")) return;

    const bookingId = e.target.dataset.id;

    Swal.fire({
      title: "Bạn chắc chắn?",
      text: "Bạn có muốn hủy đặt phòng này không?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Có, hủy ngay",
      cancelButtonText: "Không",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      const res = await fetch(`/api/user/bookings/cancel/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Thành công",
          text: "Hủy đặt phòng thành công",
          backdrop: true,
        });
        loadBookingHistory();
        window.location.reload();
      } else {
        Swal.fire({
          icon: "error",
          title: "Thất bại",
          text: "Không thể hủy phòng. Vui lòng thử lại.",
          backdrop: true,
        });
      }
    });
  });
});
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN");
}

function mapStatus(st) {
  const text = {
    choXacNhan: "Chờ xác nhận",
    daXacNhan: "Đã xác nhận",
    daHuy: "Đã hủy",
    hoanTat: "Đã hoàn thành",
    quaHan: "Quá hạn",
  };
  return text[st] || st;
}
