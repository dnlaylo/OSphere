document.addEventListener("DOMContentLoaded", () => {
    // Structural DOM Hook Selectors
    const computeBtn = document.getElementById("compute");
    const overlay = document.getElementById("popup-overlay");
    const algoDropdown = document.getElementById("algorithm");
    const referenceInput = document.getElementById("reference");
    const framesInput = document.getElementById("frames");
    
    // Inject the inline input helper note dynamically on load if not present in HTML
    if (referenceInput && !document.querySelector(".field-note-text")) {
        const note = document.createElement("p");
        note.className = "field-note-text";
        note.textContent = "Note: Please separate numbers using spaces.";
        referenceInput.parentNode.appendChild(note);
    }

    if (computeBtn) {
        computeBtn.addEventListener("click", () => {
            const selectedAlgo = algoDropdown.value;
            const rawString = referenceInput.value.trim();
            const frameCount = parseInt(framesInput.value, 10);

            // 1. Core Selection Validations
            if (selectedAlgo === "ALGORITHM" || !selectedAlgo) {
                alert("Please select a page replacement algorithm.");
                return;
            }

            if (!rawString || isNaN(frameCount) || frameCount <= 0) {
                alert("Please provide a valid reference string and number of frames.");
                return;
            }

            // 2. Strict Space-Separated Syntax Check
            if (rawString.length > 1 && !rawString.includes(" ")) {
                alert("Format Error: Please separate your page sequence numbers using spaces.");
                return;
            }

            const pages = rawString.split(" ").map(num => parseInt(num, 10)).filter(num => !isNaN(num));
            if (pages.length === 0) {
                alert("Invalid reference string format.");
                return;
            }

            // 3. Mathematical Replacement Simulation Router
            let result;
            const titleField = document.querySelector(".virtual-memory-title");
            if (selectedAlgo === "FIFO") {
                result = runFIFO(pages, frameCount);
                if (titleField) titleField.textContent = "VIRTUAL MEMORY (FIFO)";
            } else if (selectedAlgo === "LRU") {
                result = runLRU(pages, frameCount);
                if (titleField) titleField.textContent = "VIRTUAL MEMORY (LRU)";
            } else if (selectedAlgo === "OPTIMAL") {
                result = runOPTIMAL(pages, frameCount);
                if (titleField) titleField.textContent = "VIRTUAL MEMORY (OPTIMAL)";
            } else if (selectedAlgo === "LFU") { // IDINAGDAG: LFU Router hook
                result = runLFU(pages, frameCount);
                if (titleField) titleField.textContent = "VIRTUAL MEMORY (LFU)";
            }

            // 4. Matrix Generation Rendering
            renderSleekCenteredMatrix(result, pages, frameCount);
            if (overlay) overlay.classList.add("show");
        });
    }

    // Modal Window Closure Event Hooks
    if (overlay) {
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) overlay.classList.remove("show");
        });
    }


    // ==========================================================================
    // DATA SIMULATION REPLACEMENT RUNNERS
    // ==========================================================================
    function runFIFO(pages, capacity) {
        let frames = new Array(capacity).fill(null);
        let steps = [];
        let pageFaults = 0;
        let fifoPointer = 0;

        for (let i = 0; i < pages.length; i++) {
            let page = pages[i];
            let isHit = frames.indexOf(page) !== -1;

            if (!isHit) {
                frames[fifoPointer] = page;
                fifoPointer = (fifoPointer + 1) % capacity;
                pageFaults++;
            }
            steps.push({ frames: [...frames], isFault: !isHit });
        }
        return { steps, pageFaults };
    }

    function runLRU(pages, capacity) {
        let frames = new Array(capacity).fill(null);
        let steps = [];
        let pageFaults = 0;

        for (let i = 0; i < pages.length; i++) {
            let page = pages[i];
            let hitIndex = frames.indexOf(page);
            let isHit = hitIndex !== -1;

            if (!isHit) {
                let emptyIndex = frames.indexOf(null);
                if (emptyIndex !== -1) {
                    frames[emptyIndex] = page;
                } else {
                    let lruIndex = 0;
                    let oldestSeen = i;
                    for (let f = 0; f < frames.length; f++) {
                        let lastSeenIdx = pages.slice(0, i).lastIndexOf(frames[f]);
                        if (lastSeenIdx < oldestSeen) {
                            oldestSeen = lastSeenIdx;
                            lruIndex = f;
                        }
                    }
                    frames[lruIndex] = page;
                }
                pageFaults++;
            }
            steps.push({ frames: [...frames], isFault: !isHit });
        }
        return { steps, pageFaults };
    }

    function runOPTIMAL(pages, capacity) {
        let frames = new Array(capacity).fill(null);
        let steps = [];
        let pageFaults = 0;

        for (let i = 0; i < pages.length; i++) {
            let page = pages[i];
            let isHit = frames.indexOf(page) !== -1;

            if (!isHit) {
                let emptyIndex = frames.indexOf(null);
                if (emptyIndex !== -1) {
                    frames[emptyIndex] = page;
                } else {
                    let replaceIndex = 0;
                    let farthestFutureIndex = -1;

                    for (let f = 0; f < frames.length; f++) {
                        let nextUseIdx = pages.slice(i + 1).indexOf(frames[f]);
                        if (nextUseIdx === -1) {
                            replaceIndex = f;
                            break;
                        } else {
                            let absoluteFutureIdx = (i + 1) + nextUseIdx;
                            if (absoluteFutureIdx > farthestFutureIndex) {
                                farthestFutureIndex = absoluteFutureIdx;
                                replaceIndex = f;
                            }
                        }
                    }
                    frames[replaceIndex] = page;
                }
                pageFaults++;
            }
            steps.push({ frames: [...frames], isFault: !isHit });
        }
        return { steps, pageFaults };
    }

    // IDINAGDAG: LFU (Least Frequently Used) Algorithm runner
    function runLFU(pages, capacity) {
        let frames = new Array(capacity).fill(null);
        let steps = [];
        let pageFaults = 0;
        let freq = {};
        let time = {};

        for (let i = 0; i < pages.length; i++) {
            let page = pages[i];
            let isHit = frames.indexOf(page) !== -1;

            if (freq[page] === undefined) freq[page] = 0;

            if (isHit) {
                freq[page]++;
                time[page] = i; // Record use time for LRU tie-breaker if same frequency
            } else {
                let emptyIndex = frames.indexOf(null);
                if (emptyIndex !== -1) {
                    frames[emptyIndex] = page;
                } else {
                    let minFreq = Infinity;
                    let oldestSeen = Infinity;
                    let replaceIndex = -1;

                    for (let f = 0; f < frames.length; f++) {
                        let p = frames[f];
                        if (freq[p] < minFreq) {
                            minFreq = freq[p];
                            oldestSeen = time[p];
                            replaceIndex = f;
                        } else if (freq[p] === minFreq && time[p] < oldestSeen) {
                            oldestSeen = time[p];
                            replaceIndex = f;
                        }
                    }
                    frames[replaceIndex] = page;
                }
                freq[page] = 1;
                time[page] = i;
                pageFaults++;
            }
            steps.push({ frames: [...frames], isFault: !isHit });
        }
        return { steps, pageFaults };
    }

    // ==========================================================================
    // MATRIX GRAPH BUILDER ENGINE (WITH GHOST-TEXT SCRUBBER)
    // ==========================================================================
    function renderSleekCenteredMatrix(data, pages, capacity) {
        const cardContainer = document.querySelector(".modal-card");
        if (!cardContainer) return;

        // --- AGGRESSIVE DOM SCRUBBER: Wipes out old hardcoded HTML text ---
        cardContainer.querySelectorAll("div, p, span").forEach(el => {
            const txt = el.textContent.trim();
            if (txt.includes("Frames: 0") || txt.includes("Hits: 0") || txt.includes("Faults: 0") || txt.includes("Hit Rate:")) {
                el.remove();
            }
        });

        // Clean out legacy calculation wrappers if they exist
        let legacyWrapper = document.querySelector(".matrix-section-wrapper");
        if (legacyWrapper) legacyWrapper.remove();

        // 1. Build the wrapper element structures
        const sectionWrapper = document.createElement("div");
        sectionWrapper.className = "matrix-section-wrapper";

        const referenceLabel = document.createElement("div");
        referenceLabel.className = "matrix-label-header";
        referenceLabel.textContent = "Reference String:";
        sectionWrapper.appendChild(referenceLabel);

        const scrollCentrator = document.createElement("div");
        scrollCentrator.className = "matrix-scroll-centrator";

        const barsContainer = document.createElement("div");
        barsContainer.className = "memory-bars-container";

        // 2. Iterate and generate visual pipeline cells
        data.steps.forEach((step, idx) => {
            const columnWrapper = document.createElement("div");
            columnWrapper.className = "matrix-step-column";

            const numHeader = document.createElement("div");
            numHeader.className = "matrix-header-cell";
            numHeader.textContent = pages[idx];
            columnWrapper.appendChild(numHeader);

            const pillarTrack = document.createElement("div");
            pillarTrack.className = step.isFault ? "matrix-pillar-track" : "matrix-pillar-track is-hit";

            for (let slot = 0; slot < capacity; slot++) {
                const cell = document.createElement("div");
                cell.className = "matrix-frame-cell";
                cell.textContent = step.frames[slot] !== null ? step.frames[slot] : "";
                pillarTrack.appendChild(cell);
            }
            columnWrapper.appendChild(pillarTrack);
            barsContainer.appendChild(columnWrapper);
        });

        scrollCentrator.appendChild(barsContainer);
        sectionWrapper.appendChild(scrollCentrator);

        // Position directly above the lower-left info panel safely
        let resultsSummary = document.getElementById("summary-text-panel");
        if (!resultsSummary) {
            resultsSummary = document.createElement("div");
            resultsSummary.id = "summary-text-panel";
            resultsSummary.className = "modal-summary-panel";
            cardContainer.appendChild(resultsSummary);
        }
        cardContainer.insertBefore(sectionWrapper, resultsSummary);

        // 3. Re-render the metrics values cleanly at the bottom left
        const totalHits = pages.length - data.pageFaults;
        resultsSummary.innerHTML = `
            <p>No. of Frames: <span>${capacity}</span></p>
            <p>No. of Page Faults: <span style="color: #ff6b6b;">${data.pageFaults}</span></p>
            <p>No. of Hits: <span style="color: #b0cce3;">${totalHits}</span></p>
        `;
    }
});