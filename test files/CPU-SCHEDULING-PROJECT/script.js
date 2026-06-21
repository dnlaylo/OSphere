document.addEventListener("DOMContentLoaded", () => {
    let processCount = 1;

    const algorithmSelect = document.getElementById("algorithm");
    const modeSelect = document.getElementById("mode");
    const quantumInput = document.getElementById("quantum");
    const processTableBody = document.querySelector("#processTable tbody");
    const addProcessBtn = document.getElementById("addProcess");
    const computeBtn = document.getElementById("compute");
    
    const popup = document.getElementById("popup");
    const closeBtn = document.getElementById("close");
    const ganttBlocks = document.getElementById("gantt-blocks");
    const resultTable = document.getElementById("resultTable");
    const averagesDiv = document.getElementById("averages");

    // ==========================================================================
    // 1. DYNAMIC UI INTERACTION AND CONTEXT TOGGLES
    // ==========================================================================
    algorithmSelect.addEventListener("change", () => {
        const algo = algorithmSelect.value;
        
        // Handle Round Robin Time Quantum Input Visibility
        if (algo === "RR") {
            quantumInput.style.display = "inline-block";
        } else {
            quantumInput.style.display = "none";
            quantumInput.value = "";
        }

        // Handle Mode Selection Box (For SJF and Priority Variants)
        if (algo === "SJF" || algo === "PRIORITY") {
            modeSelect.style.display = "inline-block";
        } else {
            modeSelect.style.display = "none";
        }
    });

    // Handle Adding New Blank Rows
    addProcessBtn.addEventListener("click", () => {
        processCount++;
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="pid">P${processCount}</td>
            <td><input class="arrival" type="number" min="0"></td>
            <td><input class="burst" type="number" min="1"></td>
            <td><input class="priority" type="number" min="1"></td>
            <td><button class="delete">✕</button></td>
        `;
        processTableBody.appendChild(row);
        attachDeleteEvent(row.querySelector(".delete"));
    });

    function attachDeleteEvent(button) {
        button.addEventListener("click", (e) => {
            const rows = processTableBody.querySelectorAll("tr");
            if (rows.length > 1) {
                e.target.closest("tr").remove();
                reindexProcesses();
            } else {
                alert("You must keep at least one process!");
            }
        });
    }

    // Initial attach for P1 row delete button element
    document.querySelectorAll(".delete").forEach(attachDeleteEvent);

    function reindexProcesses() {
        const rows = processTableBody.querySelectorAll("tr");
        processCount = 0;
        rows.forEach((row) => {
            processCount++;
            row.querySelector(".pid").textContent = `P${processCount}`;
        });
    }

    // Pop-up Control Windows actions
    closeBtn.addEventListener("click", () => { popup.style.display = "none"; });
    window.addEventListener("click", (e) => { if (e.target === popup) popup.style.display = "none"; });

    // ==========================================================================
    // 2. CORE COMPUTATION SCHEDULING DISPATCHER
    // ==========================================================================
    computeBtn.addEventListener("click", () => {
        const algo = algorithmSelect.value;
        if (!algo) {
            alert("Please select an algorithm first!");
            return;
        }

        const rows = processTableBody.querySelectorAll("tr");
        const processes = [];
        let isValid = true;

        rows.forEach((row) => {
            const id = row.querySelector(".pid").textContent;
            const arrivalText = row.querySelector(".arrival").value;
            const burstText = row.querySelector(".burst").value;
            let priorityText = row.querySelector(".priority").value;

            if (arrivalText === "" || burstText === "") {
                isValid = false;
                return;
            }

            // Fallback safety if Priority is blank or not selected
            if (priorityText === "") {
                priorityText = "1"; 
            }

            processes.push({
                id: id,
                arrival: parseInt(arrivalText),
                burst: parseInt(burstText),
                priority: parseInt(priorityText),
                remaining: parseInt(burstText),
                startTimes: [],
                endTimes: []
            });
        });

        if (!isValid) {
            alert("Please fill out all Arrival and Burst time cells before computing.");
            return;
        }

        let quantum = parseInt(quantumInput.value);
        if (algo === "RR" && (isNaN(quantum) || quantum <= 0)) {
            alert("Please enter a valid Time Quantum greater than 0.");
            return;
        }

        // Sort baseline safe copy to begin timelines accurately
        processes.sort((a, b) => a.arrival - b.arrival);

        let timeline = [];
        const selectedMode = modeSelect.value; // "pre" or "non"

        if (algo === "FCFS") {
            timeline = runFCFS(processes);
        } else if (algo === "SJF") {
            if (selectedMode === "pre") {
                timeline = runSRTF(processes); // Preemptive SJF runs SRTF mathematics engine
            } else {
                timeline = runSJFNonPreemptive(processes); // Non-Preemptive SJF
            }
        } else if (algo === "RR") {
            timeline = runRR(processes, quantum);
        } else if (algo === "PRIORITY") {
            const isPreemptive = selectedMode === "pre";
            timeline = runPriority(processes, isPreemptive);
        }

        calculateMetrics(processes, timeline);
        renderOutput(processes, timeline);
    });

    // ==========================================================================
    // 3. CORE SCHEDULING MATHEMATICS ENGINES
    // ==========================================================================
    
    function runFCFS(procs) {
        let time = 0;
        let timeline = [];
        let pArray = JSON.parse(JSON.stringify(procs));

        pArray.forEach(p => {
            if (time < p.arrival) {
                timeline.push({ id: "Idle", start: time, end: p.arrival });
                time = p.arrival;
            }
            timeline.push({ id: p.id, start: time, end: time + p.burst });
            time += p.burst;
        });
        return timeline;
    }

    function runSJFNonPreemptive(procs) {
        let time = 0, completed = 0, n = procs.length;
        let timeline = [];
        let pArray = JSON.parse(JSON.stringify(procs));
        let isDone = Array(n).fill(false);

        while (completed < n) {
            let idx = -1;
            let minBurst = Infinity;

            for (let i = 0; i < n; i++) {
                if (pArray[i].arrival <= time && !isDone[i]) {
                    if (pArray[i].burst < minBurst) {
                        minBurst = pArray[i].burst;
                        idx = i;
                    }
                }
            }

            if (idx === -1) {
                let nextArrival = Infinity;
                for(let i=0; i<n; i++) {
                    if(!isDone[i] && pArray[i].arrival > time) {
                        nextArrival = Math.min(nextArrival, pArray[i].arrival);
                    }
                }
                timeline.push({ id: "Idle", start: time, end: nextArrival });
                time = nextArrival;
            } else {
                timeline.push({ id: pArray[idx].id, start: time, end: time + pArray[idx].burst });
                time += pArray[idx].burst;
                isDone[idx] = true;
                completed++;
            }
        }
        return compressTimeline(timeline);
    }

    function runSRTF(procs) {
        let time = 0, completed = 0, n = procs.length;
        let timeline = [];
        let pArray = JSON.parse(JSON.stringify(procs));

        let currentRunning = null;
        let startSegmentTime = 0;

        while (completed < n) {
            let idx = -1;
            let minRemaining = Infinity;

            for (let i = 0; i < n; i++) {
                if (pArray[i].arrival <= time && pArray[i].remaining > 0) {
                    if (pArray[i].remaining < minRemaining) {
                        minRemaining = pArray[i].remaining;
                        idx = i;
                    }
                }
            }

            if (idx === -1) {
                if (currentRunning !== null) {
                    timeline.push({ id: currentRunning, start: startSegmentTime, end: time });
                    currentRunning = null;
                }
                if (timeline.length > 0 && timeline[timeline.length - 1].id === "Idle") {
                    timeline[timeline.length - 1].end++;
                } else {
                    timeline.push({ id: "Idle", start: time, end: time + 1 });
                }
                time++;
            } else {
                if (currentRunning !== pArray[idx].id) {
                    if (currentRunning !== null) {
                        timeline.push({ id: currentRunning, start: startSegmentTime, end: time });
                    }
                    currentRunning = pArray[idx].id;
                    startSegmentTime = time;
                }
                pArray[idx].remaining--;
                time++;

                if (pArray[idx].remaining === 0) {
                    timeline.push({ id: currentRunning, start: startSegmentTime, end: time });
                    currentRunning = null;
                    completed++;
                }
            }
        }
        return compressTimeline(timeline);
    }

    function runRR(procs, q) {
        let time = 0;
        let timeline = [];
        let pArray = JSON.parse(JSON.stringify(procs));
        let queue = [];
        let visited = Array(pArray.length).fill(false);

        pArray.forEach((p, i) => {
            if (p.arrival === 0) {
                queue.push(p);
                visited[i] = true;
            }
        });

        if (queue.length === 0 && pArray.length > 0) {
            queue.push(pArray[0]);
            visited[0] = true;
            if(pArray[0].arrival > 0) {
                timeline.push({ id: "Idle", start: 0, end: pArray[0].arrival });
                time = pArray[0].arrival;
            }
        }

        while (queue.length > 0) {
            let p = queue.shift();
            let executionTime = Math.min(p.remaining, q);
            
            timeline.push({ id: p.id, start: time, end: time + executionTime });
            time += executionTime;
            p.remaining -= executionTime;

            pArray.forEach((pOrig, i) => {
                if (!visited[i] && pOrig.arrival <= time) {
                    queue.push(pOrig);
                    visited[i] = true;
                }
            });

            if (p.remaining > 0) {
                queue.push(p);
            } else {
                if (queue.length === 0) {
                    for (let i = 0; i < pArray.length; i++) {
                        if (!visited[i]) {
                            timeline.push({ id: "Idle", start: time, end: pArray[i].arrival });
                            time = pArray[i].arrival;
                            queue.push(pArray[i]);
                            visited[i] = true;
                            break;
                        }
                    }
                }
            }
        }
        return timeline; 
    }

    function runPriority(procs, isPreemptive) {
        let time = 0, completed = 0, n = procs.length;
        let timeline = [];
        let pArray = JSON.parse(JSON.stringify(procs));
        let currentRunning = null;
        let startSegmentTime = 0;

        while (completed < n) {
            let idx = -1;
            let highestPriority = Infinity; 

            for (let i = 0; i < n; i++) {
                if (pArray[i].arrival <= time && pArray[i].remaining > 0) {
                    if (pArray[i].priority < highestPriority) {
                        highestPriority = pArray[i].priority;
                        idx = i;
                    }
                }
            }

            if (idx === -1) {
                if (currentRunning !== null) {
                    timeline.push({ id: currentRunning, start: startSegmentTime, end: time });
                    currentRunning = null;
                }
                if (timeline.length > 0 && timeline[timeline.length - 1].id === "Idle") {
                    timeline[timeline.length - 1].end++;
                } else {
                    timeline.push({ id: "Idle", start: time, end: time + 1 });
                }
                time++;
            } else {
                if (isPreemptive) {
                    if (currentRunning !== pArray[idx].id) {
                        if (currentRunning !== null) {
                            timeline.push({ id: currentRunning, start: startSegmentTime, end: time });
                        }
                        currentRunning = pArray[idx].id;
                        startSegmentTime = time;
                    }
                    pArray[idx].remaining--;
                    time++;
                    if (pArray[idx].remaining === 0) {
                        timeline.push({ id: currentRunning, start: startSegmentTime, end: time });
                        currentRunning = null;
                        completed++;
                    }
                } else {
                    if (currentRunning !== null) {
                        timeline.push({ id: currentRunning, start: startSegmentTime, end: time });
                    }
                    timeline.push({ id: pArray[idx].id, start: time, end: time + pArray[idx].burst });
                    time += pArray[idx].burst;
                    pArray[idx].remaining = 0;
                    currentRunning = null;
                    completed++;
                }
            }
        }
        return compressTimeline(timeline);
    }

    function compressTimeline(timeline) {
        if (timeline.length === 0) return timeline;
        let compressed = [timeline[0]];
        for (let i = 1; i < timeline.length; i++) {
            let last = compressed[compressed.length - 1];
            if (timeline[i].id === last.id) {
                last.end = timeline[i].end;
            } else {
                if (timeline[i].start !== timeline[i].end) {
                    compressed.push(timeline[i]);
                }
            }
        }
        return compressed.filter(segment => segment.start !== segment.end);
    }

    // ==========================================================================
    // 4. STATISTICAL METRICS ACCUMULATOR
    // ==========================================================================
    function calculateMetrics(procs, timeline) {
        procs.forEach(p => {
            let filtering = timeline.filter(t => t.id === p.id);
            if (filtering.length > 0) {
                p.ct = filtering[filtering.length - 1].end;
                p.tat = p.ct - p.arrival;
                p.wt = p.tat - p.burst;
                
                let firstSegment = timeline.find(t => t.id === p.id);
                p.rt = firstSegment ? firstSegment.start - p.arrival : 0;
            } else {
                p.ct = 0; p.tat = 0; p.wt = 0; p.rt = 0;
            }
        });
    }

    // ==========================================================================
    // 5. RENDER SYSTEM VIEW MODAL METRICS
    // ==========================================================================
    function renderOutput(procs, timeline) {
        ganttBlocks.innerHTML = "";
        resultTable.innerHTML = "";
        averagesDiv.innerHTML = "";

        // Remove any old calculations container if it exists before drawing fresh instances
        const oldCalcDiv = document.getElementById("step-by-step-calcs");
        if (oldCalcDiv) oldCalcDiv.remove();
        const oldHr = document.getElementById("popup-divider-hr");
        if (oldHr) oldHr.remove();

        if (timeline.length === 0) return;

        const barRow = document.createElement("div");
        barRow.className = "gantt-bar-row";
        
        const timeRow = document.createElement("div");
        timeRow.className = "gantt-time-row";

        let totalDuration = timeline[timeline.length - 1].end;

        timeline.forEach((seg) => {
            let percentageWidth = ((seg.end - seg.start) / totalDuration) * 100;
            const block = document.createElement("div");
            block.className = `gantt-seg ${seg.id === "Idle" ? "idle" : ""}`;
            block.style.width = `${percentageWidth}%`;
            block.textContent = seg.id;
            barRow.appendChild(block);
        });

        timeline.forEach((seg, index) => {
            let percentageWidth = ((seg.end - seg.start) / totalDuration) * 100;
            
            if (index === 0) {
                const startStamp = document.createElement("div");
                startStamp.className = "gantt-time-cell";
                startStamp.style.width = "0%";
                startStamp.textContent = seg.start;
                timeRow.appendChild(startStamp);
            }

            const endStamp = document.createElement("div");
            endStamp.className = "gantt-time-cell";
            endStamp.style.width = `${percentageWidth}%`;
            endStamp.style.textAlign = "right";
            endStamp.textContent = seg.end;
            timeRow.appendChild(endStamp);
        });

        const chartWrapper = document.createElement("div");
        chartWrapper.className = "gantt-chart";
        chartWrapper.appendChild(barRow);
        chartWrapper.appendChild(timeRow);
        ganttBlocks.appendChild(chartWrapper);

        let tableHeaderHTML = `
            <thead>
                <tr>
                    <th>Process</th>
                    <th>Arrival Time</th>
                    <th>Burst Time</th>
                    <th>Completion Time</th>
                    <th>Turnaround Time</th>
                    <th>Waiting Time</th>
                    <th>Response Time</th>
                </tr>
            </thead>
            <tbody>
        `;
        
        let avgTat = 0, avgWt = 0, avgRt = 0;
        let formulasHTML = `<div id="step-by-step-calcs" style="margin-top:20px; font-size:14px; color:#e0e0e0; line-height:1.8;">`;
        formulasHTML += `<h3 style="color: rgba(242, 232, 164, 0.8); text-transform: uppercase; font-size:18px; margin-bottom:15px;">Step-By-Step Formulas</h3>`;
        
        procs.forEach(p => {
            avgTat += p.tat;
            avgWt += p.wt;
            avgRt += p.rt;

            tableHeaderHTML += `
                <tr>
                    <td><b>${p.id}</b></td>
                    <td>${p.arrival}</td>
                    <td>${p.burst}</td>
                    <td>${p.ct}</td>
                    <td>${p.tat}</td>
                    <td>${p.wt}</td>
                    <td>${p.rt}</td>
                </tr>
            `;

            // Build structural text logging string calculations format
            formulasHTML += `
                <div style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid #b0cce3;">
                    <p style="font-weight: 600; color: #ffffff; margin-bottom: 4px;">📈 Process ${p.id}:</p>
                    <p style="padding-left: 15px;">• Turnaround Time (TAT) = CT - AT &rarr; ${p.ct} - ${p.arrival} = <b>${p.tat} ms</b></p>
                    <p style="padding-left: 15px;">• Waiting Time (WT) = TAT - BT &rarr; ${p.tat} - ${p.burst} = <b>${p.wt} ms</b></p>
                    <p style="padding-left: 15px;">• Response Time (RT) = Start - AT &rarr; ${timeline.find(t => t.id === p.id).start} - ${p.arrival} = <b>${p.rt} ms</b></p>
                </div>
            `;
        });

        tableHeaderHTML += "</tbody>";
        resultTable.innerHTML = tableHeaderHTML;

        let totalProcesses = procs.length;
        let rawTatSum = avgTat;
        let rawWtSum = avgWt;
        let rawRtSum = avgRt;

        avgTat = (avgTat / totalProcesses).toFixed(2);
        avgWt = (avgWt / totalProcesses).toFixed(2);
        avgRt = (avgRt / totalProcesses).toFixed(2);

        averagesDiv.innerHTML = `
            <p>Average Turnaround Time: <b>${avgTat} ms</b></p>
            <p>Average Waiting Time: <b>${avgWt} ms</b></p>
            <p>Average Response Time: <b>${avgRt} ms</b></p>
        `;

        // Append System Averages Formulas Summaries
        formulasHTML += `
            <div style="background: rgba(242, 232, 164, 0.05); padding: 15px; border-radius: 8px; margin-top: 20px; border: 1px dashed rgba(242, 232, 164, 0.3);">
                <p style="font-weight: 600; color: rgba(242, 232, 164, 1); margin-bottom: 6px;">📊 Global System Averages Calculations:</p>
                <p>• Avg TAT = (${procs.map(p => p.tat).join(" + ")}) / ${totalProcesses} = ${rawTatSum} / ${totalProcesses} = <b>${avgTat} ms</b></p>
                <p>• Avg WT = (${procs.map(p => p.wt).join(" + ")}) / ${totalProcesses} = ${rawWtSum} / ${totalProcesses} = <b>${avgWt} ms</b></p>
                <p>• Avg RT = (${procs.map(p => p.rt).join(" + ")}) / ${totalProcesses} = ${rawRtSum} / ${totalProcesses} = <b>${avgRt} ms</b></p>
            </div>
        `;
        formulasHTML += `</div>`;

        // Create the horizontal rules line separator requested
        const hrElement = document.createElement("hr");
        hrElement.id = "popup-divider-hr";
        hrElement.style.border = "none";
        hrElement.style.borderTop = "1px solid rgba(255, 255, 255, 0.15)";
        hrElement.style.margin = "35px 0 20px 0";

        // Append components chronologically right before the button close wrap container
        const closeBtnParent = document.getElementById("close").parentNode;
        closeBtnParent.parentNode.insertBefore(hrElement, closeBtnParent);
        closeBtnParent.parentNode.insertBefore(document.createRange().createContextualFragment(formulasHTML), closeBtnParent);

        popup.style.display = "flex";
    }
});