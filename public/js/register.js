document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;
    const data = {
      hovaten: form.hovaten.value,
      email: form.email.value,
      matkhau: form.matkhau.value,
      xacnhanmatkhau: form.xacnhanmatkhau.value,
    };

    if (data.matkhau !== data.xacnhanmatkhau) {
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Mật khẩu và xác nhận mật khẩu không trùng nhau!",
      });
      return;
    }
    
    try {
    const res = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
      if (res.status == 201) {
        Swal.fire({
          icon: "success",
          title: "Thành công",
          text: "Bạn đã đăng ký thành công",
          backdrop: true,
        });
        form.resest();
      } else if (res.status == 400) {
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: "Vui lòng điền đủ thông tin!",
          backdrop: true,
        });
      } else if (res.status == 401){
        Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: "Mật khẩu và xác nhận mật khẩu chưa trùng khớp!",
            backdrop: true,
        });
      } else if (res.status == 409){
        Swal.fire({
            icon: "info",
            title: "Lỗi",
            text: "Email đã tồn tại!",
            backdrop: true,
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Lỗi kết nối",
        text: "Không thể kết nối tới server.",
        backdrop: true,
      });
    }
});