document.addEventListener("DOMContentLoaded", async () => {
  const resCurrent = await fetch("/current_user", {
    credentials: "include",
  });

  if (resCurrent.status === 200) {
    const user = await resCurrent.json();
    console.log("User hiện tại:", user);

    // Display
    document.getElementById("labelLogin").innerHTML = `
        Hi, ${user.user.ho} ${user.user.ten}`;
    document.querySelector(".dropdown-menu").innerHTML = `
        <li><a class="dropdown-item" href="/pages/profile.html"><i class="fa-solid fa-circle-user"></i>Xem hồ sơ</a></li>
        <li><a class="dropdown-item" id="logoutBtn" href="../index.html"><i class="fa-solid fa-right-from-bracket"></i>Đăng xuất</a></li>
      `;
    document.getElementById("logoutBtn").addEventListener("click", async () => {
      const res = await fetch("/logout", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        location.reload();
      } else {
        alert("Đăng xuất thất bại!");
      }
    });

    // Hiển thị thông tin người dùng trên trang profile
    document.getElementById("userAvatar").innerText =
      user.user.ho.charAt(0).toUpperCase() +
      user.user.ten.charAt(0).toUpperCase();
    document.getElementById("username").innerText =
      user.user.ho + " " + user.user.ten;
    document.getElementById("userRole").innerText = user.user.chucVu;

    if (user.user.chucVu === "Admin") {  
      document.getElementById(
        "profileHeader"
      ).innerHTML = `<button class="role-btn" id="adminButton" onclick="location.href='/pages/Admin_Dashboard/dashboard.html'">Admin panel</button>`;
    } else if (user.user.chucVu === "Doanh Nghiệp") { 
      document.getElementById(
        "profileHeader"
      ).innerHTML = `<button class="role-btn" id="businessButton" onclick="location.href='/pages/BusinessPersonal_Dashboard/dashboard.html'">Business panel</button>`;
    }

    document.getElementById("infoName").value =
      user.user.ho + " " + user.user.ten;
    document.getElementById("infoEmail").value = user.user.email;
    document.getElementById("infoPhone").value = user.user.soDienThoai;
    if (user.user.ngaySinh) {
      const date = new Date(user.user.ngaySinh);
      date.setDate(date.getDate() + 1); 
      const formattedDate = date.toISOString().split("T")[0];
      document.getElementById("infoBirth").value = formattedDate;
    } else {
      document.getElementById("infoBirth").value = "";
    }
    document.getElementById("infoGender").value = user.user.gioiTinh;
  }
});
