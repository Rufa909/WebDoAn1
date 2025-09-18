// Branch filtering functionality
function showBranch(branchId) {
  const sections = document.querySelectorAll(".branch-section");
  const buttons = document.querySelectorAll(".branch-btn");

  // Remove active class from all buttons
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

// Add CSS animations
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

// Smooth scroll for better UX
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth",
    });
  });
});

// Add some interactive effects
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

// --- Lấy các phần tử HTML cần thiết ---
const resultsContainer = document.getElementById('homestay-results');
const filterForm = document.querySelector('form');
const filterSections = document.querySelectorAll('.filter-section');
const minPriceInput = document.getElementById('min-price');
const maxPriceInput = document.getElementById('max-price');

// --- Hàm hiển thị danh sách Homestay ---
function displayHomestays(homestaysToDisplay) {
    resultsContainer.innerHTML = ''; 

    if (homestaysToDisplay.length === 0) {
        resultsContainer.innerHTML = '<p class="text-center">Không tìm thấy homestay nào phù hợp.</p>';
        return;
    }

    homestaysToDisplay.forEach(homestay => {
        const card = `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100">
                    <img src="${homestay.hinhAnh}" class="card-img-top" alt="${homestay.ten}">
                    <div class="card-body">
                        <h5 class="card-title">${homestay.ten}</h5>
                        <p class="card-text">📍 Quận: ${homestay.quan}</p>
                        <p class="card-text">👥 Tối đa ${homestay.soKhach} khách</p>
                        <p class="card-text">⭐ ${homestay.danhGia} sao</p>
                        <h6 class="card-text text-danger">${homestay.gia.toLocaleString('vi-VN')} VND/đêm</h6>
                    </div>
                </div>
            </div>
        `;
        resultsContainer.innerHTML += card;
    });
}

// --- Bộ lọc Homestay ---
function applyFilters() {
    const selectedFilters = {};
    filterSections.forEach(section => {
        const title = section.querySelector('h5').innerText;
        const activeButtons = section.querySelectorAll('.btn.active');

        if (activeButtons.length > 0) {
            if (title === 'Tiện ích') {
                selectedFilters.tienNghi = Array.from(activeButtons).map(btn => btn.innerText.trim());
            } else {
                selectedFilters[title] = activeButtons[0].innerText.trim();
            }
        }
    });

    const minPrice = parseFloat(minPriceInput.value) || 0;
    const maxPrice = parseFloat(maxPriceInput.value) || Infinity;

    const filteredHomestays = homestays.filter(homestay => {
        if (selectedFilters['Điểm đến'] && homestay.quan !== selectedFilters['Điểm đến']) {
            return false;
        }
        if (selectedFilters['Số Lượng khách']) {
            const range = selectedFilters['Số Lượng khách'].split('-').map(Number);
            if (homestay.soKhach < range[0] || homestay.soKhach > range[1]) {
                if (!selectedFilters['Số Lượng khách'].includes('Trên 10') || homestay.soKhach <= 10) return false;
            }
        }
        if (selectedFilters['Loại Giường'] && homestay.loaiGiuong !== selectedFilters['Loại Giường']) {
            return false;
        }
        if (selectedFilters['Số phòng'] && homestay.soPhong != selectedFilters['Số phòng']) {
            return false;
        }
        if (selectedFilters['Đánh giá']) {
            const requiredRating = parseInt(selectedFilters['Đánh giá']);
            if (homestay.danhGia < requiredRating) return false;
        }
        if (selectedFilters.tienNghi) {
            const hasAllAmenities = selectedFilters.tienNghi.every(amenity => homestay.tienNghi.includes(amenity));
            if (!hasAllAmenities) return false;
        }
        if (homestay.gia < minPrice || homestay.gia > maxPrice) {
            return false;
        }
        return true;
    });

    displayHomestays(filteredHomestays);
}

// --- Xử lý click nút filter ---
filterSections.forEach(section => {
    const buttons = section.querySelectorAll('.btn');
    const title = section.querySelector('h5').innerText;

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            if (title !== 'Tiện ích') {
                buttons.forEach(b => b.classList.remove('active'));
                button.classList.add('active');
            } else {
                button.classList.toggle('active');
            }
            applyFilters();
        });
    });
});

// --- Lọc theo giá ---
minPriceInput.addEventListener('input', applyFilters);
maxPriceInput.addEventListener('input', applyFilters);

// --- Reset filter ---
const resetButton = document.querySelector('button[type="reset"]');
resetButton.addEventListener('click', () => {
    setTimeout(() => {
        filterForm.querySelectorAll('.btn.active').forEach(b => b.classList.remove('active'));
        applyFilters();
    }, 0);
});

// --- Khi tải trang, hiển thị tất cả homestay ---
displayHomestays(homestays);
