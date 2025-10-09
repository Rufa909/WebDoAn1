document.addEventListener('DOMContentLoaded', function() {
    // Dữ liệu mẫu cho các phòng đã đặt
    const bookingsData = [
        { 
            id: 3, name: 'Sunset Home', 
            customer: 'Nguyễn Văn A', phone: '0905123456', payment: 'paid',
            checkIn: '2025-10-10', checkOut: '2025-10-12', price: 1500000 
        },
        { 
            id: 7, name: 'Double cozy home', 
            customer: 'Trần Thị B', phone: '0987654321', payment: 'unpaid',
            checkIn: '2025-10-11', checkOut: '2025-10-15', price: 2800000 
        },
        { 
            id: 10, name: 'Nest Home', 
            customer: 'Lê Văn C', phone: '0912345678', payment: 'paid',
            checkIn: '2025-10-12', checkOut: '2025-10-13', price: 950000 
        }
    ];

    const bookingGridContainer = document.getElementById('booking-grid-container');

    function renderBookedRooms() {
        if (!bookingGridContainer) return;
        bookingGridContainer.innerHTML = ''; 

        if (bookingsData.length === 0) {
            bookingGridContainer.innerHTML = '<p>Chưa có phòng nào được đặt.</p>';
            return;
        }

        bookingsData.forEach(room => {
            const card = document.createElement('div');
            card.className = 'booking-card';
            const paymentStatusClass = room.payment === 'paid' ? 'payment-paid' : 'payment-unpaid';
            const paymentStatusText = room.payment === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán';
            const formattedPrice = room.price.toLocaleString('vi-VN');

            card.innerHTML = `
                <div class="card-header"><h3>${room.name}</h3><span class="room-id">Phòng #${room.id}</span></div>
                <div class="card-body">
                    <div class="info-row"><i class="fas fa-user"></i><span>Tên khách: <b>${room.customer}</b></span></div>
                    <div class="info-row"><i class="fas fa-phone"></i><span>Số điện thoại: <b>${room.phone}</b></span></div>
                    <div class="info-row"><i class="fas fa-calendar-day"></i><span>Ngày nhận: <b>${room.checkIn}</b></span></div>
                    <div class="info-row"><i class="fas fa-calendar-day"></i><span>Ngày trả: <b>${room.checkOut}</b></span></div>
                    <div class="info-row"><i class="fas fa-money-bill-wave"></i><span>Số tiền: <b class="price">${formattedPrice} VNĐ</b></span></div>
                    <div class="info-row"><i class="fas fa-credit-card"></i><span>Thanh toán: <b class="payment-status ${paymentStatusClass}">${paymentStatusText}</b></span></div>
                </div>
            `;
            bookingGridContainer.appendChild(card);
        });
    }

    // --- Xử lý thanh thông báo đẩy ---
    const openBtn = document.getElementById('open-notification-panel');
    const closeBtn = document.getElementById('close-panel-btn');
    const panel = document.getElementById('notification-panel');
    const overlay = document.getElementById('overlay');
    const panelBody = document.getElementById('notification-panel-body');

    function populateNotifications() {
        if (!panelBody) return;
        panelBody.innerHTML = '';

        bookingsData.forEach(booking => {
            const notiItem = document.createElement('div');
            notiItem.className = 'notification-item';
            notiItem.innerHTML = `
                <div class="item-icon booking"><i class="fas fa-calendar-plus"></i></div>
                <div class="item-content">
                    <p>Khách hàng <b>${booking.customer}</b> đã đặt homestay <b>${booking.name}</b>.</p>
                    <span class="item-timestamp">${booking.checkIn}</span>
                </div>
            `;
            panelBody.appendChild(notiItem);
        });
    }
    
    function openPanel() {
        if (panel && overlay) {
            populateNotifications();
            panel.classList.add('open');
            overlay.classList.add('show');
        }
    }

    function closePanel() {
        if (panel && overlay) {
            panel.classList.remove('open');
            overlay.classList.remove('show');
        }
    }

    if (openBtn) openBtn.addEventListener('click', openPanel);
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    if (overlay) overlay.addEventListener('click', closePanel);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && panel.classList.contains('open')) {
            closePanel();
        }
    });

    // Gọi hàm render ban đầu
    renderBookedRooms();
});