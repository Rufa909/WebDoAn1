document.addEventListener("DOMContentLoaded", () => {
  // === KIỂM TRA ELEMENTS CƠ BẢN ===
  const requiredElements = [
    "room-grid-container",
    "room-modal",
    "modal-title",
    "id-h",
    "room-form",
    "cancel-button",
    "tienIch-input-visual",
    "tienIch-input",
    "tienIch-options-container",
  ];
  const missingElements = requiredElements.filter(
    (id) => !document.getElementById(id)
  );
  if (missingElements.length > 0) {
    console.error("Lỗi: Thiếu elements HTML:", missingElements);
    document.body.innerHTML =
      "<h1>Lỗi: Thiếu phần tử HTML cần thiết. Kiểm tra file HTML.</h1>";
    return;
  }

  // === KHAI BÁO BIẾN ===
  const roomGridContainer = document.getElementById("room-grid-container");
  const modal = document.getElementById("room-modal");
  const modalTitle = document.getElementById("modal-title");
  const roomForm = document.getElementById("room-form");
  const cancelButton = document.getElementById("cancel-button");
  const fileInput = document.getElementById("hinhAnh-input");

  let allRoomsData = []; // Lưu trữ dữ liệu phòng để chỉnh sửa
  let isEditingMode = false;
  let currentEditingMaPhong = null;
  //  Thêm các biến toàn cục để lưu homestay
  let CURRENT_HOMESTAY_ID = null;
  let CURRENT_HOMESTAY_DETAILS = null; // Để lưu tên, địa chỉ...
  const tienIchPillContainer = document.getElementById("tienIch-input-visual");
  const tienIchHiddenInput = document.getElementById("tienIch-input");
  // Đọc idHomestay từ URL
  const urlParams = new URLSearchParams(window.location.search);
  const idHomestayFromUrl = urlParams.get("idHomestay");
  if (!idHomestayFromUrl) {
    // Nếu không có ID, không thể tiếp tục
    console.error("Lỗi: Không tìm thấy idHomestay trên URL.");
    document.body.innerHTML =
      '<h1>Lỗi: Không tìm thấy mã homestay. Vui lòng quay lại <a href="my-homestays.html">trang chọn homestay</a>.</h1>';
    return; // Dừng toàn bộ script
  }
  
  // Gán ID nếu nó tồn tại
  CURRENT_HOMESTAY_ID = idHomestayFromUrl;
  const tienIchOptionsContainer = document.getElementById(
    "tienIch-options-container"
  );
  const ALL_AMENITIES = [
    "TV",
    "Bồn tắm",
    "Tủ lạnh",
    "Máy giặt",
    "Ban công",
    "View đẹp",
    "Máy chiếu",
  ];

  // Map icon cho từng tiện ích (sử dụng Font Awesome) - Chỉ thêm mới
  const AMENITY_ICONS = {
    "TV": "fa-tv",
    "Bồn tắm": "fa-bath",
    "Tủ lạnh": "fa-snowflake",
    "Máy giặt":"fa-tshirt",
    "Ban công": "fa-rainbow",
    "View đẹp": "fa-cloud",
    "Máy chiếu": "fa-film",
  };

  // === CÁC HÀM TIỆN ÍCH ===
  const formatCurrency = (number) => {
    const numericValue = Number(number);
    if (isNaN(numericValue)) return "N/A";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(numericValue);
  };

  const safeSelector = (value) => CSS.escape(value);
  const updateHiddenInputAndButtons = () => {
    const pills = tienIchPillContainer.querySelectorAll(".tienIch-pill");
    const values = Array.from(pills).map((pill) => pill.dataset.value);
    tienIchHiddenInput.value = values.join(",");
    const optionButtons =
      tienIchOptionsContainer.querySelectorAll(".tienIch-option");
    optionButtons.forEach((btn) => {
      btn.classList.toggle("selected", values.includes(btn.dataset.value));
    });
  };

  const removePill = (pillElement) => {
    pillElement.remove();
    updateHiddenInputAndButtons();
    // Hiện lại option tương ứng khi xóa pill - Chỉ thêm mới
    const amenityValue = pillElement.dataset.value;
    const optionButtons =
      tienIchOptionsContainer.querySelectorAll(".tienIch-option");
    optionButtons.forEach((btn) => {
      if (btn.dataset.value === amenityValue) {
        btn.style.display = "inline-block"; // Hiện lại
      }
    });
  };

  const addPill = (amenity) => {
    const trimmedAmenity = amenity.trim();
    if (!trimmedAmenity) return;
    const existingValues = tienIchHiddenInput.value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (existingValues.includes(trimmedAmenity)) return;
    const pill = document.createElement("span");
    pill.className = "tienIch-pill";
    pill.dataset.value = trimmedAmenity;
    const iconClass = AMENITY_ICONS[trimmedAmenity] || "fa-star"; // Thêm icon - Chỉ chỉnh mới
    pill.innerHTML = `<i class="fas ${iconClass}"></i> ${trimmedAmenity} <span class="tienIch-pill-delete" data-value="${trimmedAmenity}">&times;</span>`;
    pill.querySelector(".tienIch-pill-delete").addEventListener("click", () => {
      removePill(pill);
    });
    tienIchPillContainer.appendChild(pill);
    // Ẩn option tương ứng sau khi thêm pill - Chỉ thêm mới
    const optionButtons =
      tienIchOptionsContainer.querySelectorAll(".tienIch-option");
    optionButtons.forEach((btn) => {
      if (btn.dataset.value === trimmedAmenity) {
        btn.style.display = "none"; // Ẩn option đã chọn
      }
    });
    updateHiddenInputAndButtons();
  };

  const renderTienIchOptions = () => {
    tienIchOptionsContainer.innerHTML = "";
    ALL_AMENITIES.forEach((amenity) => {
      const btn = document.createElement("span");
      btn.className = "tienIch-option";
      btn.textContent = amenity;
      btn.dataset.value = amenity;
      const iconClass = AMENITY_ICONS[amenity] || "fa-star"; // Thêm icon cho option - Chỉ chỉnh mới
      btn.innerHTML = `<i class="fas ${iconClass}"></i> ${amenity}`;
      btn.addEventListener("click", () => {
        if (!btn.classList.contains("selected")) {
          addPill(amenity);
          updateHiddenInputAndButtons();
        }
      });
      tienIchOptionsContainer.appendChild(btn);
    });
  };

  // Preview ảnh
  const previewImg = document.createElement("img");
  previewImg.id = "image-preview";
  previewImg.style.cssText =
    "max-width: 100%; max-height: 200px; margin-top: 10px; display: none; border-radius: 4px;";
  const fileGroup = fileInput.parentElement;
  fileGroup.appendChild(previewImg); // Thêm preview vào form-group

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImg.src = e.target.result;
        previewImg.style.display = "block";
      };
      reader.readAsDataURL(file);
    } else {
      previewImg.style.display = "none";
    }
  });

  // === CÁC HÀM HIỂN THỊ GIAO DIỆN (UI) ===
  const renderRoomCards = (rooms) => {
    try {
      roomGridContainer.innerHTML = "";
      if (!rooms || rooms.length === 0) {
        roomGridContainer.innerHTML =
          '<p class="loading-message">Bạn chưa có phòng nào trong hệ thống.</p>';
      } else {
        rooms.forEach((room) => {
          const roomCard = createRoomCard(room);
          roomGridContainer.appendChild(roomCard);
        });
      }
      // Luôn hiển thị card "Thêm phòng"
      const addCard = createAddRoomCard();
      roomGridContainer.appendChild(addCard);
    } catch (error) {
      console.error("Lỗi render cards:", error);
      roomGridContainer.innerHTML =
        '<p class="error-message">Lỗi hiển thị dữ liệu phòng.</p>';
    }
  };

  const createRoomCard = (room) => {
    const roomCard = document.createElement("div");
    roomCard.className = "room-card-detailed";
    if (room.status) {
      roomCard.classList.add(`status-${room.status.toLowerCase()}`);
    } else {
      roomCard.classList.add("status-vacant");
    }
    roomCard.dataset.maPhong = room.maPhong;
    const amenities = (room.tienIch || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const amenitiesHTML =
      amenities.length > 0
        ? amenities
            .map((a) => `<span class="card-amenity-pill">${a}</span>`)
            .join(", ")
        : "<span>N/A</span>";
    //  Lấy tên và địa chỉ homestay từ biến toàn cục
    const homestayName = CURRENT_HOMESTAY_DETAILS?.tenHomestay || "N/A";
    const homestayAddress = CURRENT_HOMESTAY_DETAILS?.diaChi || "N/A";
    roomCard.innerHTML = `
      <div class="room-image-container">
        <img 
          src="${
            room.hinhAnh ? "/" + room.hinhAnh : "/images/default-room.png"
          }" 
          alt="Ảnh ${room.tenPhong}" 
          class="room-image"
          onerror="this.onerror=null; this.src='/images/default-room.png';"
        >
      </div>
      <div class="room-info">
        <h3 class="room-name">${room.tenPhong || "N/A"}</h3>
        <div class="info-section">
          <p class="info-line"><strong>Mã phòng:</strong> <span>${
            room.maPhong || "N/A"
          }</span></p>
          <p class="info-line"><strong>Homestay:</strong> <span>${
            homestayName || "N/A"
          }</span></p>
          <p class="info-line"><strong>Địa chỉ:</strong> <span>${
            homestayAddress || "N/A"
          }</span></p>
          <p class="info-line"><strong>Số khách:</strong> <span>${
            room.soLuongKhach || "N/A"
          }</span></p>
          <p class="info-line"><strong>Loại Giường:</strong> <span>${
            room.loaiGiuong || "N/A"
          }</span></p>
          <p class="info-line"><strong>Tiện ích:</strong> <span>${amenitiesHTML}</span></p>
          <p class="info-line"><strong>Giá:</strong> <span class="price">${formatCurrency(
            room.gia
          )}</span></p>
          <p class="info-line"><strong>Giá theo giờ:</strong> <span class="price">${formatCurrency(
            room.giaKhungGio
          )}</span></p>
        </div>
        <div class="room-actions">
          <button class="action-btn edit-btn" data-action="edit">Sửa</button>
          <button class="action-btn delete-btn" data-action="delete">Xóa</button>
        </div>
      </div>
    `;
    return roomCard;
  };

  const createAddRoomCard = () => {
    const addCard = document.createElement("div");
    addCard.className = "add-room-card";
    addCard.innerHTML = `
      <i class="fas fa-plus-circle"></i>
      <span>Thêm phòng mới</span>
    `;
    addCard.addEventListener("click", () => {
      showModal(null); // Chế độ thêm mới
    });
    return addCard;
  };

  // === CÁC HÀM XỬ LÝ MODAL ===
  const showModal = (room) => {
    roomForm.reset();
    previewImg.style.display = "none";
    fileInput.value = "";
    tienIchPillContainer.innerHTML = "";
    tienIchHiddenInput.value = "";
    renderTienIchOptions();

    const idHomestayInput = document.getElementById("id-h"); // Input ẩn
    const infoName = document.getElementById("modal-homestay-name");
    const infoId = document.getElementById("modal-homestay-id");
    const infoAddress = document.getElementById("modal-homestay-address");
    if (!CURRENT_HOMESTAY_DETAILS) {
    alert("Lỗi: Không tải được thông tin homestay. Không thể thực hiện.");
    return;
  }
  
  // Điền thông tin từ biến toàn cục
    infoName.textContent = CURRENT_HOMESTAY_DETAILS.tenHomestay || "Chưa có";
    infoId.textContent = CURRENT_HOMESTAY_ID;
    //Gộp địa chỉ
    const addressParts = [
        CURRENT_HOMESTAY_DETAILS.diaChiChiTiet || "", 
        CURRENT_HOMESTAY_DETAILS.diaChi || ""      
    ];
    infoAddress.textContent = addressParts.filter(Boolean).join(', ');
    idHomestayInput.value = CURRENT_HOMESTAY_ID; // Gán ID vào input ẩn
 

  //  XỬ LÝ RIÊNG CHO CHẾ ĐỘ EDIT (ĐIỀN THÔNG TIN PHÒNG)
  if (room) {
    // Chế độ edit
    isEditingMode = true;
    currentEditingMaPhong = room.maPhong;
    modalTitle.textContent = "Chỉnh sửa thông tin phòng";

    // Chỉ điền các thông tin CỦA PHÒNG
    document.getElementById("tenPhong-input").value = room.tenPhong || "";
    document.getElementById("loaiGiuong-input").value = room.loaiGiuong || "";
    document.getElementById("soLuongKhach-input").value =
      room.soLuongKhach || "";
    document.getElementById("moTa-input").value = room.moTa || "";
    document.getElementById("gia-input").value = room.gia || "";
    document.getElementById("giaKhungGio-input").value = room.giaKhungGio || "";

    // Xử lý Tiện ích
    if (room.tienIch) {
      const existingTienIch = room.tienIch
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      existingTienIch.forEach((amenity) => addPill(amenity));
    }
    
    // Hiển thị ảnh cũ
    if (room.hinhAnh) {
      previewImg.src = "/" + room.hinhAnh;
      previewImg.style.display = "block";
    }
  } else {
    // Chế độ thêm mới
    isEditingMode = false;
    currentEditingMaPhong = null;
    modalTitle.textContent = "Thêm phòng mới";
    // Không cần làm gì thêm, vì thông tin homestay đã được điền ở BƯỚC 1.
  }

  updateHiddenInputAndButtons();
  modal.style.display = "flex";
};

const hideModal = () => {
  modal.style.display = "none";
  isEditingMode = false; // Reset mode
  currentEditingMaPhong = null;
  previewImg.style.display = "none";
  fileInput.value = "";
  tienIchPillContainer.innerHTML = "";
  tienIchHiddenInput.value = "";
  
    renderTienIchOptions();
};

  // === CÁC HÀM GỌI API ===
  const fetchAndDisplayRooms = async () => {
    roomGridContainer.innerHTML =
      '<p class="loading-message">Đang tải thông tin phòng...</p>';
    try {
     const response = await fetch(
        `/api/my-homestays/${CURRENT_HOMESTAY_ID}/details`, // API MỚI
        {
          credentials: "include",
        }
      ); 
      if (response.status === 401) {
        window.location.href = "/pages/login.html";
        return;
      }
      if (!response.ok) {
        throw new Error(
          `Lỗi mạng: ${response.status} - ${response.statusText}`
        );
      }
      const data = await response.json();

      
      // Xử lý cấu trúc dữ liệu mới { homestay, rooms }
      if (!data.homestay || !Array.isArray(data.rooms)) {
        throw new Error("Dữ liệu trả về không hợp lệ (thiếu homestay hoặc rooms).");
      }

      CURRENT_HOMESTAY_DETAILS = data.homestay; // Lưu chi tiết homestay
      allRoomsData = data.rooms; // Lưu danh sách phòng

      console.log("Dữ liệu homestay:", CURRENT_HOMESTAY_DETAILS);
      console.log("Dữ liệu phòng:", allRoomsData);

      // Cập nhật tiêu đề trang (Tùy chọn)
      const headerTitle = document.querySelector(".header h2");
      if (headerTitle) {
        headerTitle.textContent = `Danh sách phòng của ${CURRENT_HOMESTAY_DETAILS.tenHomestay || 'Homestay'}`;
      }

      renderRoomCards(allRoomsData);
      attachEventListeners();
    }catch (error) {
      console.error("Không thể lấy dữ liệu phòng:", error);
      roomGridContainer.innerHTML = `<p class="error-message">Không thể tải dữ liệu: ${error.message}. Vui lòng thử lại.</p>`;
    }
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    const tenPhong = document.getElementById("tenPhong-input").value.trim();
    const gia = parseFloat(document.getElementById("gia-input").value);

    if (!tenPhong || !gia || gia <= 0) {
      alert("Vui lòng điền đầy đủ tên phòng và giá > 0.");
      return;
    }

    const formData = new FormData();
    formData.append("tenPhong", tenPhong);
   
    formData.append(
      "loaiGiuong",
      document.getElementById("loaiGiuong-input").value.trim()
    );
    formData.append(
      "soLuongKhach",
      document.getElementById("soLuongKhach-input").value
    );
    formData.append("gia", gia);
    formData.append(
      "giaKhungGio",
      document.getElementById("giaKhungGio-input").value || 0
    );
    formData.append("tienIch", tienIchHiddenInput.value); // <-- Lấy từ input ẩn
    
    formData.append("moTa", document.getElementById("moTa-input").value.trim());
    formData.append("tenHomestay",CURRENT_HOMESTAY_DETAILS.tenHomestay || ""  );
    formData.append("diaChi",CURRENT_HOMESTAY_DETAILS.diaChi || ""  );
    formData.append("diaChiChiTiet",CURRENT_HOMESTAY_DETAILS.diaChiChiTiet || ""  );
    formData.append("idHomestay",document.getElementById("id-h").value // Lấy từ input ẩn
    );
    if (fileInput.files[0]) {
      formData.append("hinhAnh", fileInput.files[0]); // Upload file
    }

    const url = isEditingMode
      ? `/api/my-business-rooms/${encodeURIComponent(currentEditingMaPhong)}`
      : "/api/my-business-rooms";
    const method = isEditingMode ? "PUT" : "POST";

    try {
      console.log("Gửi request:", {
        url,
        method,
        isEditingMode,
        hasFile: !!fileInput.files[0],
      });
      const response = await fetch(url, {
        method,
        body: formData,
        credentials: "include", // Session
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Lỗi server: ${response.status}`);
      }

      const data = await response.json();
      alert(
        data.message ||
          (isEditingMode ? "Cập nhật thành công!" : "Thêm phòng thành công!")
      );
      hideModal();
      fetchAndDisplayRooms(); // Reload
    } catch (error) {
      console.error("Lỗi khi lưu phòng:", error);
      alert(`Lỗi: ${error.message}`);
    }
  };

  const handleDeleteRoom = async (maPhong) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa phòng có mã ${maPhong} không?`))
      return;

    try {
      const encodedMaPhong = encodeURIComponent(maPhong);
      const response = await fetch(`/api/my-business-rooms/${encodedMaPhong}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Lỗi server: ${response.status}`);
      }

      alert("Xóa phòng thành công!");
      allRoomsData = allRoomsData.filter(
        (r) => String(r.maPhong) !== String(maPhong)
      );
      renderRoomCards(allRoomsData); // Re-render
    } catch (error) {
      console.error("Lỗi khi xóa phòng:", error);
      alert(`Lỗi: ${error.message}`);
    }
  };

  // === GẮN KẾT SỰ KIỆN ===
  const attachEventListeners = () => {
    roomGridContainer.removeEventListener("click", handleGridClick);
    roomGridContainer.addEventListener("click", handleGridClick);
  };

  const handleGridClick = (event) => {
    const target = event.target;
    if (target.tagName === "BUTTON" && target.dataset.action) {
      const action = target.dataset.action;
      const card = target.closest(".room-card-detailed");
      if (!card) return;
      const maPhong = card.dataset.maPhong;

      if (action === "edit") {
        const roomToEdit = allRoomsData.find(
          (r) => String(r.maPhong) === String(maPhong)
        );
        if (roomToEdit) {
          showModal(roomToEdit); // Set isEditingMode = true
        } else {
          alert("Không tìm thấy dữ liệu phòng để chỉnh sửa. Tải lại trang.");
        }
      } else if (action === "delete") {
        handleDeleteRoom(maPhong);
      }
    }
  };

  // Gắn sự kiện
  roomForm.addEventListener("submit", handleFormSubmit);
  cancelButton.addEventListener("click", hideModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) hideModal();
  });

  // === KHỞI CHẠY ===
  fetchAndDisplayRooms();

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
