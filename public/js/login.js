function togglePassword() {
  const passwordInput = document.getElementById("password");
  const toggleBtn = document.querySelector(".password-toggle");

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    toggleBtn.textContent = "Ẩn";
  } else {
    passwordInput.type = "password";
    toggleBtn.textContent = "Hiện";
  }
}
