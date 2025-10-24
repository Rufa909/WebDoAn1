function showBranch(branchId) {
  const sections = document.querySelectorAll(".branch-section");
  const buttons = document.querySelectorAll(".branch-btn");

  buttons.forEach((btn) => btn.classList.remove("active"));

  // Add active class to clicked button
  event.target.classList.add("active");

  if (branchId === "all") {
    sections.forEach((section) => {
      section.style.display = "block";
      section.style.animation = "fadeIn 0.5s ease-in-out";
    });
  } else {
    sections.forEach((section) => {
      if (section.dataset.branch === branchId) {
        section.style.display = "block";
        section.style.animation = "fadeIn 0.5s ease-in-out";
      } else {
        section.style.display = "none";
      }
    });
  }
}

const style = document.createElement("style");
style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes bounceIn {
                0% { transform: scale(0.3); opacity: 0; }
                50% { transform: scale(1.1); opacity: 0.8; }
                70% { transform: scale(0.9); opacity: 0.9; }
                100% { transform: scale(1); opacity: 1; }
            }
        `;
document.head.appendChild(style);

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth",
    });
  });
});

document.querySelectorAll(".room-card").forEach((card) => {
  card.addEventListener("mouseenter", function () {
    this.style.transform = "translateY(-10px) scale(1.02)";
  });

  card.addEventListener("mouseleave", function () {
    this.style.transform = "translateY(0) scale(1)";
  });
});
function showFilter() {
    document.getElementById('filterBox').style.display = 'block';
}

function hideFilter() {
    document.getElementById('filterBox').style.display = 'none';
}
document.addEventListener('DOMContentLoaded', async () => {
    const filterBox = document.getElementById('filterBox');
    const filterForm = document.getElementById('filterForm');
    const showFilterBtn = document.getElementById('showFilterBtn');
    const closeFilterBtn = document.getElementById('closeFilterBtn');

   if (filterBox) {
        filterBox.style.display = 'none';
    }

    function toggleFilter() {
        if (filterBox) {
            const isVisible = filterBox.style.display === 'block';
            filterBox.style.display = isVisible ? 'none' : 'block';
        }
    }
    
    if (showFilterBtn) showFilterBtn.addEventListener('click', toggleFilter);
    if (closeFilterBtn) closeFilterBtn.addEventListener('click', toggleFilter);

    if (filterForm) {
        filterForm.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' && e.target.closest('.filter-options')) {
                const button = e.target;
                const parentSection = button.closest('.filter-section');
                const isMultiSelect = parentSection.querySelector('h5').innerText.includes('Tiện ích');

                // 🔹 Loại bỏ focus ngay sau khi click để không bị kẹt trạng thái
                button.blur();

                if (!isMultiSelect) {
                    if (button.classList.contains('active')) {
                        button.classList.remove('active');
                    } else {
                        parentSection.querySelectorAll('.btn.active').forEach(b => b.classList.remove('active'));
                        button.classList.add('active');
                    }
                } else {
                    button.classList.toggle('active');
                }
}
        });

        filterForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Ngăn form tự gửi đi

            const params = new URLSearchParams();

            filterForm.querySelectorAll('[data-location].active').forEach(btn => params.append('location', btn.dataset.location));
            filterForm.querySelectorAll('[data-guests].active').forEach(btn => params.append('guests', btn.dataset.guests));
            filterForm.querySelectorAll('[data-bed-type].active').forEach(btn => params.append('bedType', btn.dataset.bedType));
            filterForm.querySelectorAll('[data-amenity].active').forEach(btn => params.append('amenities', btn.dataset.amenity));
            const minPrice = document.getElementById('min-price').value;
            const maxPrice = document.getElementById('max-price').value;

            if (minPrice) params.append('minPrice', minPrice);
            if (maxPrice) params.append('maxPrice', maxPrice);

            window.location.href = `/pages/results.html?${params.toString()}`;

        });

        filterForm.addEventListener('reset', () => {
            filterForm.querySelectorAll('.btn.active').forEach(b => b.classList.remove('active'));
            
           
        });
        
    }
});
document.addEventListener('DOMContentLoaded', async () => {
  const amenitiesIconMap = {
    'be boi': 'fa-swimming-pool',
    'view dep': 'fa-rainbow',
    'phong gym': 'fa-dumbbell',
    'may chieu': 'fa-film',
    'ban cong': 'fa-cloud',
    'bep': 'fa-utensils',
    'bon tam': 'fa-bath'
  };

  // 🔹 Tạo HTML tiện ích
  function createAmenitiesHtml(room) {
    const amenitiesText = room.tienIch || '';
    const amenitiesList = amenitiesText.split(',');
    const itemsHtml = amenitiesList.map(item => {
      const text = item.trim();
      if (!text) return '';
      const key = text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace('đ', 'd');
      const icon = amenitiesIconMap[key] || 'fa-check-circle';
      return `<li><i class="fa-solid ${icon}"></i> ${text}</li>`;
    });


    itemsHtml.push(`<li><i class="fa-solid fa-bed"></i> ${room.loaiGiuong}</li>`);
    itemsHtml.push(`<li><i class="fa-solid fa-users"></i> ${room.soLuongKhach} khách</li>`);

    return `<ul class="room-amenities">${itemsHtml.join('')}</ul>`;
  }

  // 🔹 Tạo thẻ card phòng
  function createRoomCardHtml(room) {
    const imageUrl = `http://localhost:3000/${room.hinhAnh}`;
    const amenities = createAmenitiesHtml(room);

    return `
      <div class="card room-card">
        <div class="room-image" style="background-image: url('${imageUrl}')"></div>
        <div class="card-body">
          <h5 class="card-title">${room.tenPhong}</h5>
          <p class="room-price">
            ${new Intl.NumberFormat('vi-VN').format(room.gia)} VNĐ/đêm
          </p>
          ${amenities}
         <button class="btn btn-datphong">Đặt phòng</button>
        </div>
      </div>`;
  }

  // 🔹 Gọi API
  try {
    const response = await fetch('http://localhost:3000/api/rooms-grouped-by-company');
    if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);

    const groupedData = await response.json(); // là một MẢNG

    let finalHtml = '';

    // ✅ Lặp đúng theo mảng
    for (const doanhNghiep of groupedData) {
      const roomsHtml = doanhNghiep.phong.map(createRoomCardHtml).join('');
      finalHtml += `
        <div class="enterprise-block">
          <h3 class="address-header">${doanhNghiep.tenHomestay}</h3>
          <div class="scroll-container">
            <div class="rooms-grid">${roomsHtml}</div>
          </div>
        </div>
      `;
    }

    document.getElementById('homestay-sections').innerHTML = finalHtml;
  } catch (error) {
    console.error('Lỗi:', error);
    document.getElementById('homestay-sections').innerHTML =
      '<p class="text-danger text-center">Không thể tải dữ liệu phòng.</p>';
  }
});
