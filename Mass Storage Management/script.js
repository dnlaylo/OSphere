document.addEventListener("DOMContentLoaded", () => {
    const computeBtn = document.querySelector(".algorithm-thq-compute-button-elm");
    const overlay = document.getElementById("popup-overlay");
    const backdropContainer = document.querySelector(".output-container1");
  
    // Open popup on compute click
    if (computeBtn) {
      computeBtn.addEventListener("click", () => {
        overlay.classList.add("show");
      });
    }
  
    // Close popup when clicking outside the content window box
    if (overlay) {
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay || event.target === backdropContainer) {
          overlay.classList.remove("show");
        }
      });
    }
  });