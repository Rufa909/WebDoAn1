document.addEventListener('DOMContentLoaded', function() {
    // Dữ liệu mẫu cho 4 hóa đơn
    const invoicesData = [
        {
            id: 'HD001',
            roomName: 'Sunset Home',
            checkIn: '2025-10-10',
            checkOut: '2025-10-12',
            totalDays: 2,
            pricePerNight: 750000,
            guest: {
                name: 'Nguyễn Văn A',
                address: '123 Đường ABC, Q.1, TP.HCM',
                phone: '0905123456',
                email: 'nguyenvana@email.com',
                cccd: '012345678910',
            },
            paymentMethod: 'Chuyển khoản',
            homestayAddress: '456 Đường XYZ, Cần Thơ'
        },
        {
            id: 'HD002',
            roomName: 'Dream Home',
            checkIn: '2025-11-05',
            checkOut: '2025-11-08',
            totalDays: 3,
            pricePerNight: 850000,
            guest: {
                name: 'Trần Thị B',
                address: '456 Đường DEF, Hà Nội',
                phone: '0987654321',
                email: 'tranthib@email.com',
                cccd: '098765432109',
            },
            paymentMethod: 'Tiền mặt',
            homestayAddress: '456 Đường XYZ, Cần Thơ'
        },
        {
            id: 'HD003',
            roomName: 'Fini Home',
            checkIn: '2025-11-20',
            checkOut: '2025-11-21',
            totalDays: 1,
            pricePerNight: 600000,
            guest: {
                name: 'Lê Văn C',
                address: '789 Đường GHI, Đà Nẵng',
                phone: '0912345678',
                email: 'levanc@email.com',
                cccd: '054321987654',
            },
            paymentMethod: 'Thẻ tín dụng',
            homestayAddress: '456 Đường XYZ, Cần Thơ'
        },
        {
            id: 'HD004',
            roomName: 'Luxury Home',
            checkIn: '2025-12-01',
            checkOut: '2025-12-05',
            totalDays: 4,
            pricePerNight: 1200000,
            guest: {
                name: 'Phạm Thị D',
                address: '101 Đường JKL, Cần Thơ',
                phone: '0939999999',
                email: 'phamthid@email.com',
                cccd: '091827364501',
            },
            paymentMethod: 'Chuyển khoản',
            homestayAddress: '456 Đường XYZ, Cần Thơ'
        }
    ];

    const tableBody = document.getElementById('invoice-table-body');

    function renderInvoiceTable() {
        if (!tableBody) return;
        tableBody.innerHTML = ''; // Xóa dữ liệu cũ

        invoicesData.forEach(invoice => {
            const totalPrice = invoice.totalDays * invoice.pricePerNight;

            let paymentClass = '';
            if (invoice.paymentMethod === 'Tiền mặt') paymentClass = 'cash';
            else if (invoice.paymentMethod === 'Chuyển khoản') paymentClass = 'transfer';
            else if (invoice.paymentMethod === 'Thẻ tín dụng') paymentClass = 'card';

            const row = `
                <tr>
                    <td>
                        <div class="customer-info">
                            <b>${invoice.roomName}</b>
                            <span>${invoice.homestayAddress}</span>
                        </div>
                    </td>
                    <td>
                        <div class="customer-info">
                            <b>${invoice.guest.name}</b>
                            <span>CCCD: ${invoice.guest.cccd}</span>
                        </div>
                    </td>
                    <td>
                        <div>
                            <b>Nhận:</b> ${invoice.checkIn}<br>
                            <b>Trả:</b> ${invoice.checkOut}
                        </div>
                    </td>
                    <td>
                        <div class="total-price">
                            ${totalPrice.toLocaleString('vi-VN')} VNĐ
                        </div>
                        <span>(${invoice.totalDays} đêm)</span>
                    </td>
                    <td>
                        <div class="contact-info">
                            <b>${invoice.guest.phone}</b>
                            <span>${invoice.guest.email}</span>
                        </div>
                    </td>
                    <td>
                        <span class="payment-method ${paymentClass}">${invoice.paymentMethod}</span>
                    </td>
                    <td class="action-buttons">
                        <button title="In hóa đơn"><i class="fas fa-print"></i></button>
                        <button title="Xóa"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }

    renderInvoiceTable();
});