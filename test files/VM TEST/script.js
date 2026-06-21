document.addEventListener("DOMContentLoaded", () => {
    const computeButton = document.getElementById("compute-btn");
    const popupOverlay = document.getElementById("popup-overlay");
    const mainAppWrapper = document.getElementById("main-app-wrapper");
    const closePopupButton = document.getElementById("close-popup-btn"); // Bagong elemento

    if (computeButton && popupOverlay && mainAppWrapper) {
        
        // 1. Buksan ang popup kapag kinlik ang COMPUTE
        computeButton.addEventListener("click", () => {
            popupOverlay.style.display = "flex";
            setTimeout(() => {
                popupOverlay.classList.add("active");
                mainAppWrapper.classList.add("blur-background");
            }, 10);
        });

        // REUSABLE CLOSING FUNCTION (Para hindi paulit-ulit ang code)
        const closePopup = () => {
            popupOverlay.classList.remove("active");
            mainAppWrapper.classList.remove("blur-background");
            setTimeout(() => {
                popupOverlay.style.display = "none";
            }, 300);
        };

        // 2. Isara ang popup kapag pinindot ang BAGONG X BUTTON
        if (closePopupButton) {
            closePopupButton.addEventListener("click", closePopup);
        }

        // 3. Isara pa rin ang popup kapag pinindot ang labas (dark space) ng modal card
        popupOverlay.addEventListener("click", (event) => {
            if (event.target === popupOverlay) {
                closePopup();
            }
        });
    }
});