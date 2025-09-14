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
