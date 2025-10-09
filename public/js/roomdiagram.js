document.addEventListener('DOMContentLoaded', function() {

  
    const roomsData = [
        { id: 1, name: 'Fini Home', status: 'booked' },
        { id: 2, name: 'Dream Home', status: 'pending' },
        { id: 3, name: 'Sunset Home', status: 'booked' },
        { id: 4, name: 'Twin Home', status: 'vacant' },
        { id: 5, name: 'Gray Home', status: 'vacant' },
        { id: 6, name: 'Luca Home', status: 'vacant' },
        { id: 7, name: 'Double cozy home', status: 'vacant' },
        { id: 8, name: 'Sweet Dreams', status: 'vacant' },
        { id: 9, name: 'Luxury home', status: 'vacant' },
        { id: 10, name: 'Nest Home', status: 'vacant' },
        { id: 11, name: 'Luca Home', status: 'vacant' },
        { id: 12, name: 'Warm Home', status: 'vacant' },
        { id: 13, name: 'Lucy Home', status: 'vacant' },
        { id: 14, name: 'Zen Home', status: 'vacant' },
        { id: 15, name: 'Couple Home', status: 'vacant' },
        { id: 16, name: 'Sunny Home', status: 'vacant' },
        { id: 17, name: 'Secret Home', status: 'vacant' },
        { id: 18, name: 'Dynamic Game home', status: 'vacant' },
        { id: 19, name: 'Bloom home', status: 'vacant' },
        { id: 20, name: 'Sky home', status: 'vacant' },
        { id: 21, name: 'Pearl home', status: 'vacant' },
        { id: 22, name: 'Grace home', status: 'vacant' },
        { id: 23, name: 'Elite home', status: 'vacant' },
        { id: 24, name: 'Velvet home', status: 'vacant' },
        { id: 25, name: 'Flair home', status: 'vacant' },
        { id: 26, name: 'Pink Paradise', status: 'vacant' },
        { id: 27, name: 'Swan home', status: 'vacant' },
        { id: 28, name: 'Eden home', status: 'vacant' },
        { id: 29, name: 'Iris home', status: 'vacant' },
        { id: 30, name: 'Nova home', status: 'vacant' },
        { id: 31, name: 'Eve home', status: 'vacant' },
        { id: 32, name: 'Ivory home', status: 'vacant' },
        { id: 33, name: 'Opal home', status: 'vacant' },
        { id: 34, name: 'Eclipse home', status: 'vacant' },
        { id: 35, name: 'Zenith home', status: 'vacant' },
        { id: 36, name: 'Luxe home', status: 'vacant' },
        { id: 37, name: 'Solace home', status: 'vacant' },
        { id: 38, name: 'Aurora home', status: 'vacant' },
        { id: 39, name: 'Eden Home', status: 'vacant' },
        { id: 40, name: 'Diamond Home', status: 'vacant' },
        { id: 41, name: 'Emerald Home', status: 'vacant' },
        { id: 42, name: 'Harmony Home', status: 'vacant' },
        { id: 43, name: 'Crystal Home', status: 'vacant' },
        { id: 44, name: 'Olive Home', status: 'vacant' },
        { id: 45, name: 'Amber Home', status: 'vacant' },
        { id: 46, name: 'Clover Home', status: 'vacant' },
        { id: 47, name: 'Tranquil Home', status: 'vacant' },
        { id: 48, name: 'Meadow Home', status: 'vacant' },
        { id: 49, name: 'Serene Home', status: 'vacant' },
        { id: 50, name: 'Majestic Home', status: 'vacant' },
        { id: 51, name: 'Lily Home', status: 'vacant' },
        { id: 52, name: 'Rose Home', status: 'vacant' },
        { id: 53, name: 'Daisy Home', status: 'vacant' },
        { id: 54, name: 'Lotus Home', status: 'vacant' },
        { id: 55, name: 'Coral Home', status: 'vacant' }
    ];

    // --- PHẦN 2: CÁC HÀM XỬ LÝ GIAO DIỆN ---
    const roomGridContainer = document.getElementById('room-grid-container');

    function renderRooms() {
        if (!roomGridContainer) return;
        roomGridContainer.innerHTML = '';

        roomsData.forEach(room => {
            const roomCardWrapper = document.createElement('div');
            roomCardWrapper.className = `status-${room.status}`;

            let statusIconHtml = '';
            if (room.status === 'vacant') {
                statusIconHtml = '<i class="fa-solid fa-arrow-right-from-bracket status-icon"></i>';
            } else if (room.status === 'booked') {
                statusIconHtml = '<i class="fa-solid fa-check status-icon"></i>';
            } else if (room.status === 'pending') {
                statusIconHtml = '<i class="fa-solid fa-hourglass-start status-icon"></i>';
            }

            roomCardWrapper.innerHTML = `
                <div class="room-card">
                    <h3>${room.id}</h3>
                    <p>${room.name}</p>
                    ${statusIconHtml}
                </div>
            `;
            roomGridContainer.appendChild(roomCardWrapper);
        });
    }

    function updateStatusCounts() {
        const counts = {
            'booked': 0,
            'vacant': 0,
            'pending': 0,
        };

        roomsData.forEach(room => {
            if (counts.hasOwnProperty(room.status)) {
                counts[room.status]++;
            }
        });

        for (const status in counts) {
            const countElement = document.getElementById(`count-${status}`);
            if (countElement) {
                countElement.textContent = counts[status];
            }
        }
    }

    // --- PHẦN 3: GỌI HÀM KHI TẢI TRANG ---
    renderRooms();
    updateStatusCounts();
});