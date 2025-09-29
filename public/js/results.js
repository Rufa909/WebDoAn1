document.addEventListener('DOMContentLoaded', () => {
    // --- 1. LẤY CÁC PHẦN TỬ VÀ THAM SỐ TỪ URL ---
    const resultsContainer = document.getElementById('homestay-results');
    const params = new URLSearchParams(window.location.search);

    // Chuyển các tham số từ URL thành một đối tượng chứa tiêu chí lọc
    const activeFilters = {
        location: params.get('location'),
        guests: params.get('guests'),
        bedType: params.get('bedType'),
        rooms: params.get('rooms'),
        rating: params.get('rating'),
        amenities: params.getAll('amenities'), // .getAll() để lấy tất cả các tiện ích đã chọn
        minPrice: parseFloat(params.get('minPrice')) || 0,
        maxPrice: parseFloat(params.get('maxPrice')) || Infinity
    };

    // --- 2. HÀM HIỂN THỊ KẾT QUẢ ---
    // js/results.js

function displayHomestays(homestaysToDisplay) {
    if (!resultsContainer) {
        console.error("Lỗi: Không tìm thấy phần tử #homestay-results.");
        return;
    }

    if (homestaysToDisplay.length === 0) {
        resultsContainer.innerHTML = '<p class="text-center fs-5 text-muted col-12">Rất tiếc, không có homestay nào phù hợp với lựa chọn của bạn.</p>';
        return;
    }

    const cardsHTML = homestaysToDisplay.map(homestay => {
        // Tùy chọn: Tạo HTML cho các tiện ích chính
        const mainAmenitiesHTML = homestay.tienNghi.slice(0, 3).map(amenity => 
            `<span class="amenity"><i class="fa-solid fa-layer-group "></i> ${amenity.replace(/-/g, ' ')}</span>`
        ).join('');

        return `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card h-100 shadow-sm border-0 room-card">
                    <img src="${homestay.hinhAnh}" class="card-img-top room-image" alt="${homestay.ten}">
                    <div class="card-body d-flex flex-column room-info">
                        <h3 class="room-name">${homestay.ten}</h3>
                        
                        <p class="card-text text-muted mb-2">
                            <i class="fa-solid fa-location-dot"></i> ${homestay.quan}
                        </p>

                        <div class="amenities mb-3">
                            <span class="amenity"><i class="fa-solid fa-users"></i> ${homestay.soKhach} người</span>
                            <span class="amenity"><i class="fa-solid fa-door-open"></i> ${homestay.soPhong} phòng</span>
                            <span class="amenity"><i class="fa-solid fa-bed"></i> ${homestay.loaiGiuong.replace('-', ' ')}</span>
                            <span class="amenity">${homestay.danhGia} <i class="fa-solid fa-star text-warning"></i></span>
                        </div>

                        <div class="amenities mb-3">
                            ${mainAmenitiesHTML}
                        </div>

                        <h4 class="room-price mt-auto">${homestay.gia.toLocaleString('vi-VN')} VNĐ/đêm</h4>
                        <a href="#" class="book-btn">Đặt phòng</a>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    resultsContainer.innerHTML = cardsHTML;
}

    // --- 3. LOGIC LỌC CHÍNH ---

    // Kiểm tra xem biến 'homestays' có tồn tại không (từ data.js)
    if (typeof homestays === 'undefined') {
        console.error("Lỗi: Không tìm thấy dữ liệu 'homestays'. Hãy đảm bảo tệp data.js đã được nạp trước results.js.");
        return;
    }

    const filteredHomestays = homestays.filter(homestay => {
        const homestayLocationSlug = homestay.quan.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/\s+/g, '-');
        const guestRange = activeFilters.guests ? activeFilters.guests.split('-').map(Number) : null;

        // Bắt đầu kiểm tra. Nếu một điều kiện không khớp, homestay sẽ bị loại (return false).
        if (activeFilters.location && homestayLocationSlug !== activeFilters.location) return false;
        if (activeFilters.bedType && homestay.loaiGiuong !== activeFilters.bedType) return false;
        if (activeFilters.rooms && homestay.soPhong != activeFilters.rooms) return false;
        if (activeFilters.rating && homestay.danhGia < parseInt(activeFilters.rating)) return false;
        if (guestRange) {
            if (activeFilters.guests === 'tren-10') {
                if (homestay.soKhach <= 10) return false;
            } else if (homestay.soKhach < guestRange[0] || homestay.soKhach > guestRange[1]) {
                return false;
            }
        }
        if (homestay.gia < activeFilters.minPrice || homestay.gia > activeFilters.maxPrice) return false;
        if (activeFilters.amenities.length > 0 && !activeFilters.amenities.every(amenity => homestay.tienNghi.includes(amenity))) return false;

        // Nếu vượt qua tất cả, homestay được giữ lại (return true)
        return true;
    });

    // --- 4. KHỞI TẠO ---
    // Hiển thị các homestay đã được lọc ra màn hình
    displayHomestays(filteredHomestays);
});