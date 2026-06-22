document.addEventListener("DOMContentLoaded", () => {
  // ==========================================================================
  // 0. GLOBAL VARIABLES & ELEMENT SELECTION
  // ==========================================================================
  let processCount = 1;

  const algorithmSelect = document.getElementById("algorithm");
  const modeSelect = document.getElementById("mode");
  const quantumInput = document.getElementById("quantum");
  const processTableBody = document.querySelector("#processTable tbody");
  const addProcessBtn = document.getElementById("addProcess");
  const computeBtn = document.getElementById("compute");
  
  // Popup Elements
  const popupOverlay = document.getElementById("popup-overlay");
  const backdropContainer = document.querySelector(".output-container1");
  
  // Output Elements
  const ganttBlocks = document.getElementById("gantt-blocks");
  const resultTable = document.getElementById("resultTable");
  const averagesDiv = document.getElementById("averages");

  // ==========================================================================
  // 1. POPUP WINDOW CONTROLS
  // ==========================================================================
  if (popupOverlay) {
      popupOverlay.addEventListener("click", (event) => { 
          if (event.target === popupOverlay || event.target === backdropContainer) {
              popupOverlay.classList.remove("show");
          }
      });
  }

  // ==========================================================================
  // 2. DYNAMIC UI INTERACTION AND LAYOUT-SAFE CONTROLS
  // ==========================================================================
  function updateUIContext() {
      const algo = algorithmSelect.value;
      // MLFQ hint wrapper toggle
const wrapper = document.getElementById("quantum-wrapper");
const hint = document.getElementById("mlfq-hint");

if (algo === "RR" || algo === "MLQ" || algo === "MLFQ") {
    wrapper.style.display = "flex";

    if (algo === "MLFQ") {
        hint.style.display = "block";
        quantumInput.placeholder = "Base Quantum (Q0)";
    } else {
        hint.style.display = "none";
        quantumInput.placeholder = "Time Quantum";
    }
} else {
    wrapper.style.display = "none";
    quantumInput.value = "";
}   // 1. Toggle for Time Quantum Display
      if (algo === "RR" || algo === "MLQ" || algo === "MLFQ") {
          quantumInput.style.display = "inline-block";
          if (algo === "MLFQ") {
              quantumInput.placeholder = "Base Quantum (Q0)";
          } else {
              quantumInput.placeholder = "Time Quantum";
          }
      } else {
          quantumInput.style.display = "none";
          quantumInput.value = "";
      }

      // 2. Toggle for Preemptive/Non-Preemptive Mode Selector Box
      if (algo === "SJF" || algo === "PRIORITY") {
          modeSelect.style.display = "inline-block";
      } else {
          modeSelect.style.display = "none";
      }

      // 3. Dynamic Structural Priority Column Hiding Engine
      const requiresPriority = (algo === "PRIORITY" || algo === "MLQ");
      const priorityCells = document.querySelectorAll(".priority-col");
      
      // Dynamic Header Label Switching
      const thPriority = document.querySelector("#processTable th.priority-col");
      if (thPriority) {
          thPriority.textContent = algo === "MLQ" ? "Queue (1=High, 2=Low)" : "Priority";
      }

      // Apply layout-safe appearance adjustments
      priorityCells.forEach(cell => {
          if (requiresPriority) {
              cell.style.display = ""; // Defaults to native table-cell
          } else {
              cell.style.display = "none"; // Safe structural hiding
          }
      });

      // Recalculate column layout scales based on visibility states
      const tableEl = document.getElementById("processTable");
      if (tableEl) {
          const visibleColumnsCount = requiresPriority ? 5 : 4;
          const percentageWidth = 100 / visibleColumnsCount;
          const allHeaders = tableEl.querySelectorAll("th");
          const allDataCells = tableEl.querySelectorAll("td");
          
          allHeaders.forEach(th => { if(th.style.display !== "none") th.style.width = `${percentageWidth}%`; });
          allDataCells.forEach(td => { if(td.style.display !== "none") td.style.width = `${percentageWidth}%`; });
      }
  }

  algorithmSelect.addEventListener("change", updateUIContext);

  // Handle Adding New Rows Safely
  addProcessBtn.addEventListener("click", () => {
      processCount++;
      const row = document.createElement("tr");
      row.innerHTML = `
          <td class="pid">P${processCount}</td>
          <td><input class="arrival" type="number" min="0"></td>
          <td><input class="burst" type="number" min="1"></td>
          <td class="priority-col"><input class="priority" type="number" min="1" value="1"></td>
          <td><button class="delete">✕</button></td>
      `;
      processTableBody.appendChild(row);
      attachDeleteEvent(row.querySelector(".delete"));
      
      // Instantly synchronize structural state for newly born cells
      updateUIContext();
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

  document.querySelectorAll(".delete").forEach(attachDeleteEvent);

  function reindexProcesses() {
      const rows = processTableBody.querySelectorAll("tr");
      processCount = 0;
      rows.forEach((row) => {
          processCount++;
          row.querySelector(".pid").textContent = `P${processCount}`;
      });
  }

  // Run on start to establish clean default parameters
  updateUIContext();

  // ==========================================================================
  // 3. CORE COMPUTATION SCHEDULING DISPATCHER
  // ==========================================================================
  computeBtn.addEventListener("click", () => {
      const algo = algorithmSelect.value;
      // MLFQ quantum hint visibility control

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

          if (priorityText === "" || isNaN(priorityText)) {
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
      if ((algo === "RR" || algo === "MLQ" || algo === "MLFQ") && (isNaN(quantum) || quantum <= 0)) {
          alert("Please enter a valid Time Quantum greater than 0.");
          return;
      }

      processes.sort((a, b) => a.arrival - b.arrival);

      let timeline = [];
      const selectedMode = modeSelect.value; 

      if (algo === "FCFS") {
          timeline = runFCFS(processes);
      } else if (algo === "SJF") {
          if (selectedMode === "pre") {
              timeline = runSRTF(processes); 
          } else {
              timeline = runSJFNonPreemptive(processes); 
          }
      } else if (algo === "RR") {
          timeline = runRR(processes, quantum);
      } else if (algo === "PRIORITY") {
          const isPreemptive = selectedMode === "pre";
          timeline = runPriority(processes, isPreemptive);
      } else if (algo === "HRRN") {
          timeline = runHRRN(processes);
      } else if (algo === "MLQ") {
          timeline = runMLQ(processes, quantum);
      } else if (algo === "MLFQ") {
          timeline = runMLFQ(processes, quantum);
      }

      processes.sort((a, b) => {
          const numA = parseInt(a.id.replace("P", ""));
          const numB = parseInt(b.id.replace("P", ""));
          return numA - numB;
      });

      calculateMetrics(processes, timeline);
      renderOutput(processes, timeline);
      
      popupOverlay.classList.add("show");
  });

  // ==========================================================================
  // 4. CORE SCHEDULING MATHEMATICS ENGINES
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

  function runHRRN(procs) {
      let time = 0, completed = 0, n = procs.length;
      let timeline = [];
      let pArray = JSON.parse(JSON.stringify(procs));
      let isDone = Array(n).fill(false);

      while (completed < n) {
          let idx = -1;
          let maxHrr = -1;

          for (let i = 0; i < n; i++) {
              if (pArray[i].arrival <= time && !isDone[i]) {
                  let waitingTime = time - pArray[i].arrival;
                  let hrr = (waitingTime + pArray[i].burst) / pArray[i].burst;
                  if (hrr > maxHrr) {
                      maxHrr = hrr;
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

  function runMLQ(procs, q) {
      let time = 0, completed = 0, n = procs.length;
      let timeline = [];
      let pArray = JSON.parse(JSON.stringify(procs));
      
      let q1_ready = []; 
      let q2_ready = []; 
      
      let currentRunning = null;
      let currentQueueLevel = 0; 
      let quantumLeft = 0;
      let startSegmentTime = 0;

      while (completed < n) {
          pArray.forEach(p => {
              if (p.arrival === time) {
                  if (p.priority === 1) q1_ready.push(p);
                  else q2_ready.push(p);
              }
          });

          if (currentRunning && currentQueueLevel === 2 && q1_ready.length > 0) {
              timeline.push({ id: currentRunning.id, start: startSegmentTime, end: time });
              q2_ready.unshift(currentRunning); 
              currentRunning = null;
          } 
          else if (currentRunning && currentQueueLevel === 1 && quantumLeft === 0) {
              timeline.push({ id: currentRunning.id, start: startSegmentTime, end: time });
              if (currentRunning.remaining > 0) q1_ready.push(currentRunning);
              currentRunning = null;
          }

          if (!currentRunning) {
              if (q1_ready.length > 0) {
                  currentRunning = q1_ready.shift();
                  currentQueueLevel = 1;
                  quantumLeft = Math.min(currentRunning.remaining, q);
                  startSegmentTime = time;
              } else if (q2_ready.length > 0) {
                  currentRunning = q2_ready.shift();
                  currentQueueLevel = 2;
                  startSegmentTime = time;
              }
          }

          if (currentRunning) {
              currentRunning.remaining--;
              time++;
              if (currentQueueLevel === 1) quantumLeft--;

              if (currentRunning.remaining === 0) {
                  timeline.push({ id: currentRunning.id, start: startSegmentTime, end: time });
                  completed++;
                  currentRunning = null;
              }
          } else {
              if (timeline.length > 0 && timeline[timeline.length - 1].id === "Idle") {
                  timeline[timeline.length - 1].end++;
              } else {
                  timeline.push({ id: "Idle", start: time, end: time + 1 });
              }
              time++;
          }
      }
      return compressTimeline(timeline);
  }

function runMLFQ(procs, q) {
    let time = 0;
    let completed = 0;
    let n = procs.length;

    let timeline = [];
    let pArray = JSON.parse(JSON.stringify(procs));

    let q0 = []; // highest priority (RR q)
    let q1 = []; // mid priority (RR 2q)
    let q2 = []; // lowest priority (FCFS)

    let current = null;
    let level = -1;
    let quantumLeft = 0;
    let startTime = 0;

    function addArrivals() {
        for (let i = 0; i < n; i++) {
            if (pArray[i].arrival === time) {
                q0.push(pArray[i]); // always enter highest queue
            }
        }
    }

    function preempt() {
        if (!current) return false;

        // higher queue always interrupts lower
        if (level === 1 && q0.length > 0) return true;
        if (level === 2 && (q0.length > 0 || q1.length > 0)) return true;

        return false;
    }

    while (completed < n) {
        addArrivals();

        // =========================
        // PREEMPTION RULE
        // =========================
        if (preempt()) {
            timeline.push({
                id: current.id,
                start: startTime,
                end: time
            });

            if (current.remaining > 0) {
                if (level === 1) q1.unshift(current);
                else if (level === 2) q2.unshift(current);
            }

            current = null;
        }

        // =========================
        // DISPATCHER (SELECT PROCESS)
        // =========================
        if (!current) {
            if (q0.length > 0) {
                current = q0.shift();
                level = 0;
                quantumLeft = q;
            } 
            else if (q1.length > 0) {
                current = q1.shift();
                level = 1;
                quantumLeft = 2 * q;
            } 
            else if (q2.length > 0) {
                current = q2.shift();
                level = 2;
                quantumLeft = Infinity; // FCFS behavior
            }

            startTime = time;
        }

        // =========================
        // EXECUTION
        // =========================
        if (current) {
            current.remaining--;
            time++;

            if (level === 0 || level === 1) {
                quantumLeft--;
            }

            // FINISH PROCESS
            if (current.remaining === 0) {
                timeline.push({
                    id: current.id,
                    start: startTime,
                    end: time
                });

                current = null;
                completed++;
                continue;
            }

            // =========================
            // DEMOTION RULE
            // =========================
            if (level === 0 && quantumLeft === 0) {
                timeline.push({
                    id: current.id,
                    start: startTime,
                    end: time
                });

                q1.push(current);
                current = null;
            } 
            else if (level === 1 && quantumLeft === 0) {
                timeline.push({
                    id: current.id,
                    start: startTime,
                    end: time
                });

                q2.push(current);
                current = null;
            }
        } 
        else {
            // IDLE
            if (
                timeline.length > 0 &&
                timeline[timeline.length - 1].id === "Idle"
            ) {
                timeline[timeline.length - 1].end++;
            } else {
                timeline.push({
                    id: "Idle",
                    start: time,
                    end: time + 1
                });
            }
            time++;
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
  // 5. STATISTICAL METRICS ACCUMULATOR
  // ==========================================================================
  function calculateMetrics(procs, timeline) {
      procs.forEach(p => {
          let filtering = timeline.filter(t => t.id === p.id);
          if (filtering.length > 0) {
              p.ct = filtering[filtering.length - 1].end;
              p.tat = p.ct - p.arrival;
              p.wt = p.tat - p.burst;
          } else {
              p.ct = 0; p.tat = 0; p.wt = 0;
          }
      });
  }

  // ==========================================================================
  // 6. RENDER SYSTEM VIEW MODAL METRICS
  // ==========================================================================
  function renderOutput(procs, timeline) {
      ganttBlocks.innerHTML = "";
      resultTable.innerHTML = "";
      averagesDiv.innerHTML = "";

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
              </tr>
          </thead>
          <tbody>
      `;
      
      let avgTat = 0, avgWt = 0;
      let formulasHTML = `<div id="step-by-step-calcs" style="margin-top:20px; font-size:14px; color:#e0e0e0; line-height:1.8;">`;
      formulasHTML += `<h3 style="color: rgba(242, 232, 164, 0.8); text-transform: uppercase; font-size:18px; margin-bottom:15px;">Step-By-Step Formulas</h3>`;
      
      procs.forEach(p => {
          avgTat += p.tat;
          avgWt += p.wt;

          tableHeaderHTML += `
              <tr>
                  <td><b>${p.id}</b></td>
                  <td>${p.arrival}</td>
                  <td>${p.burst}</td>
                  <td>${p.ct}</td>
                  <td>${p.tat}</td>
                  <td>${p.wt}</td>
              </tr>
          `;

          formulasHTML += `
              <div style="background: rgba(255,255,255,0.02); padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid #b0cce3;">
                  <p style="font-weight: 600; color: #ffffff; margin-bottom: 4px;">📈 Process ${p.id}:</p>
                  <p style="padding-left: 15px;">• Turnaround Time (TAT) = CT - AT &rarr; ${p.ct} - ${p.arrival} = <b>${p.tat} ms</b></p>
                  <p style="padding-left: 15px;">• Waiting Time (WT) = TAT - BT &rarr; ${p.tat} - ${p.burst} = <b>${p.wt} ms</b></p>
              </div>
          `;
      });

      tableHeaderHTML += "</tbody>";
      resultTable.innerHTML = tableHeaderHTML;

      let totalProcesses = procs.length;
      let rawTatSum = avgTat;
      let rawWtSum = avgWt;

      avgTat = (avgTat / totalProcesses).toFixed(2);
      avgWt = (avgWt / totalProcesses).toFixed(2);

      averagesDiv.innerHTML = `
          <p>Average Turnaround Time: <b>${avgTat} ms</b></p>
          <p>Average Waiting Time: <b>${avgWt} ms</b></p>
      `;

      formulasHTML += `
          <div style="background: rgba(242, 232, 164, 0.05); padding: 15px; border-radius: 8px; margin-top: 20px; border: 1px dashed rgba(242, 232, 164, 0.3);">
              <p style="font-weight: 600; color: rgba(242, 232, 164, 1); margin-bottom: 6px;">📊 Global System Averages Calculations:</p>
              <p>• Avg TAT = (${procs.map(p => p.tat).join(" + ")}) / ${totalProcesses} = ${rawTatSum} / ${totalProcesses} = <b>${avgTat} ms</b></p>
              <p>• Avg WT = (${procs.map(p => p.wt).join(" + ")}) / ${totalProcesses} = ${rawWtSum} / ${totalProcesses} = <b>${avgWt} ms</b></p>
          </div>
      `;
      formulasHTML += `</div>`;

      const hrElement = document.createElement("hr");
      hrElement.id = "popup-divider-hr";
      hrElement.style.border = "none";
      hrElement.style.borderTop = "1px solid rgba(255, 255, 255, 0.15)";
      hrElement.style.margin = "35px 0 20px 0";

      document.querySelector('.popup-content').appendChild(hrElement);
      document.querySelector('.popup-content').insertAdjacentHTML('beforeend', formulasHTML);
  }
});