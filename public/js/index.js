function showBranch(branchId) {
  const sections = document.querySelectorAll(".branch-section");
  const buttons = document.querySelectorAll(".branch-btn");

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
document.addEventListener('DOMContentLoaded', () => {
    const filterBox = document.getElementById('filterBox');
    const filterForm = document.getElementById('filterForm');
    const showFilterBtn = document.getElementById('showFilterBtn');
    const closeFilterBtn = document.getElementById('closeFilterBtn');

    function toggleFilter() {
        if (filterBox) {
            const isVisible = filterBox.style.display === 'block';
            filterBox.style.display = isVisible ? 'none' : 'block';
        }
    }

    if (showFilterBtn) showFilterBtn.addEventListener('click', toggleFilter);
    if (closeFilterBtn) closeFilterBtn.addEventListener('click', toggleFilter);

    if (filterForm) {
        filterForm.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' && e.target.closest('.filter-options')) {
                const button = e.target;
                const parentSection = button.closest('.filter-section');
                const isMultiSelect = parentSection.querySelector('h5').innerText.includes('Tiện ích');

                if (!isMultiSelect) {
                    if (button.classList.contains('active')) {
                        button.classList.remove('active');
                    } 
                    else {
                        parentSection.querySelectorAll('.btn.active').forEach(b => b.classList.remove('active'));
                        button.classList.add('active');
                    }
                } 
                else {
                    button.classList.toggle('active');
                }
            }
        });

        filterForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Ngăn form tự gửi đi

            const params = new URLSearchParams();

            filterForm.querySelectorAll('[data-location].active').forEach(btn => params.append('location', btn.dataset.location));
            filterForm.querySelectorAll('[data-guests].active').forEach(btn => params.append('guests', btn.dataset.guests));
            filterForm.querySelectorAll('[data-bed-type].active').forEach(btn => params.append('bedType', btn.dataset.bedType));
            filterForm.querySelectorAll('[data-rooms].active').forEach(btn => params.append('rooms', btn.dataset.rooms));
            filterForm.querySelectorAll('[data-rating].active').forEach(btn => params.append('rating', btn.dataset.rating));
            filterForm.querySelectorAll('[data-ameity].active').forEach(btn => params.append('amenities', btn.dataset.ameity));
            
            const minPrice = document.getElementById('min-price').value;
            const maxPrice = document.getElementById('max-price').value;

            if (minPrice) params.append('minPrice', minPrice);
            if (maxPrice) params.append('maxPrice', maxPrice);

            window.location.href = `results.html?${params.toString()}`;
        });

        filterForm.addEventListener('reset', () => {
            filterForm.querySelectorAll('.btn.active').forEach(b => b.classList.remove('active'));
            
           
        });
    }
});