document.addEventListener("DOMContentLoaded", () => {
  loadPendingHomestays();
});

async function loadPendingHomestays() {
  const container = document.getElementById("homestay-grid-container");
  container.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>`;

  try {
    const res = await fetch("/api/admin/homestays/choDuyet", {
      credentials: "include",
    });
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = "<p>Không có homestay nào cần duyệt.</p>";
      return;
    }

    container.innerHTML = "";

    data.forEach((hs) => {
      const card = document.createElement("div");
      card.className = "homestay-card";

      card.innerHTML = `
        <div class="card-header">
          <h3>${hs.tenHomestay}</h3>
          <span class="badge pending">Chờ duyệt</span>
        </div>

        <div class="card-body">
          <p><i class="fa-solid fa-user"></i> Doanh nghiệp: <b>${
            hs.hoDoanhNghiep + " " + hs.tenDoanhNghiep || "Không rõ"
          }</b></p>
          <p><i class="fa-solid fa-location-dot"></i> Địa chỉ: <b>${hs.diaChi}</b></p>
          <p><i class="fa-solid fa-envelope"></i> Email: <b>${
            hs.email || "Không có email"
          }</b></p>
          <p><i class="fa-solid fa-phone"></i> Số điện thoại: <b>${
            hs.sdt || "Không có số điện thoại"
          }</p>
        </div>

        <div class="card-actions">
          <button class="btn-approve" onclick="approveHomestay(${
            hs.idHomestay
          })">
            <i class="fa-solid fa-check"></i> Duyệt
          </button>
          <button class="btn-reject" onclick="rejectHomestay(${hs.idHomestay})">
            <i class="fa-solid fa-xmark"></i> Từ chối
          </button>
        </div>
      `;

      container.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Lỗi tải dữ liệu.</p>";
  }
}

async function approveHomestay(id) {
  const result = await Swal.fire({
    title: "Duyệt homestay?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Duyệt",
  });

  if (!result.isConfirmed) return;

  const res = await fetch(`/api/admin/homestays/${id}/duyet`, {
    method: "PUT",
  });
  if (!res.ok) {
    return Swal.fire("Lỗi", "Không duyệt được homestay", "error");
  }

  Swal.fire("Thành công", "Homestay đã được duyệt", "success");
  loadPendingHomestays();
}

async function rejectHomestay(id) {
  const confirm = await Swal.fire({
    title: "Từ chối homestay?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Từ chối",
  });

  if (!confirm.isConfirmed) return;

  await fetch(`/api/admin/homestays/${id}/tuChoi`, {
    method: "PUT",
  });

  Swal.fire("Đã từ chối", "Homestay đã bị từ chối", "info");
  loadPendingHomestays();
}
