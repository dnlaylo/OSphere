document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.getElementById("menuToggle");
  const closeMenuBtn = document.getElementById("closeMenuBtn");
  const sideMenu = document.getElementById("sideMenu");
  const sideMenuOverlay = document.getElementById("sideMenuOverlay");

  // Open menu and blur background
  menuToggle.addEventListener("click", () => {
    sideMenu.classList.add("open");
    sideMenuOverlay.classList.add("open");
    document.body.classList.add("no-scroll");
  });

  // Close menu functions
  const closeMenu = () => {
    sideMenu.classList.remove("open");
    sideMenuOverlay.classList.remove("open");
    document.body.classList.remove("no-scroll");
  };

  closeMenuBtn.addEventListener("click", closeMenu);
  sideMenuOverlay.addEventListener("click", closeMenu);
});

// Dropdown Toggle Logic
function toggleDropdown(dropdownId, btnElement) {
  const dropdown = document.getElementById(dropdownId);
  const chevron = btnElement.querySelector('.chevron');
  
  // Toggle the visibility classes
  dropdown.classList.toggle('open');
  chevron.classList.toggle('open');
}