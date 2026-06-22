document.addEventListener('DOMContentLoaded', () => {
  // UI Event Listeners
  document.getElementById('cpuAlgo').addEventListener('change', function() {
      document.getElementById('quantumGroup').style.display = (this.value === 'RR') ? 'flex' : 'none';
  });

  document.getElementById('memAlgo').addEventListener('change', function() {
      if (this.value === 'MFT') {
          document.getElementById('mftConfigGroup').style.display = 'flex';
          document.getElementById('mvtConfigGroup').style.display = 'none';
      } else if (this.value === 'MVT') {
          document.getElementById('mftConfigGroup').style.display = 'none';
          document.getElementById('mvtConfigGroup').style.display = 'flex';
      }
  });

  document.getElementById('addRowBtn').addEventListener('click', addProcessRow);
  document.getElementById('compute').addEventListener('click', simulateSystem);

  // Modal Close Logic
  const popupOverlay = document.getElementById('popup-overlay');
  popupOverlay.addEventListener('click', (e) => {
      if (e.target === popupOverlay) {
          popupOverlay.classList.remove('show');
      }
  });

  // Initialize with one empty row
  addProcessRow();
});

function addProcessRow() {
  const table = document.getElementById('processTable').getElementsByTagName('tbody')[0];
  const rowCount = table.rows.length + 1;
  const row = table.insertRow();
  
  // Adjusted inputs to match the 4 columns shown in your layout image
  row.innerHTML = `
      <td><input type="text" value="P${rowCount}"></td>
      <td><input type="number" min="0" placeholder="0"></td>
      <td><input type="number" min="1" placeholder="3"></td>
      <td><input type="number" min="1" placeholder="25"></td>
      <td><button class="btn-danger" onclick="deleteRow(this)">X</button></td>
  `;
}

function deleteRow(btn) {
  const row = btn.parentNode.parentNode;
  row.parentNode.removeChild(row);
}

function simulateSystem() {
  const memAlgo = document.getElementById('memAlgo').value;
  const totalMem = parseInt(document.getElementById('totalMem').value);
  const cpuAlgo = document.getElementById('cpuAlgo').value;
  const quantum = parseInt(document.getElementById('quantum').value) || 1;
  const compactionEnabled = document.getElementById('compactionOpt').value === 'YES';
  
  if (!memAlgo || isNaN(totalMem)) {
      return alert("Please select a memory algorithm and specify total memory size.");
  }

  const rows = document.getElementById('processTable').getElementsByTagName('tbody')[0].rows;
  let initialProcesses = [];

  for (let i = 0; i < rows.length; i++) {
      let inputs = rows[i].getElementsByTagName('input');
      initialProcesses.push({
          id: inputs[0].value,
          arrival: parseInt(inputs[1].value),
          burst: parseInt(inputs[2].value),
          remainingBurst: parseInt(inputs[2].value),
          memReq: parseInt(inputs[3].value), // Index 3 matches Mem. Req column
          allocatedPartitionIndex: -1,
          finishTime: -1,
          memoryArriveTime: -1
      });
  }

  if(initialProcesses.length === 0) return alert("Please add at least one process.");

  // Initialize Memory Spaces
  let partitions = [];
  if (memAlgo === 'MFT') {
      let customSizesRaw = document.getElementById('customPartitions').value;
      let customSizes = customSizesRaw.split(',').map(s => parseInt(s.trim())).filter(s => !isNaN(s) && s > 0);
      
      if (customSizes.length === 0) return alert("Please enter valid MFT partition sizes.");

      let currentStart = 0;
      for (let i = 0; i < customSizes.length; i++) {
          let size = customSizes[i];
          if (currentStart + size > totalMem) {
              size = totalMem - currentStart;
              if (size > 0) partitions.push({ start: currentStart, size: size, used: 0, residentProcess: null });
              currentStart += size;
              break;
          }
          partitions.push({ start: currentStart, size: size, used: 0, residentProcess: null });
          currentStart += size;
      }
      if (currentStart < totalMem) {
          partitions.push({ start: currentStart, size: totalMem - currentStart, used: totalMem - currentStart, residentProcess: "SYSTEM_WASTE" });
      }
  } else {
      partitions.push({ start: 0, size: totalMem, used: 0, residentProcess: null });
  }

  let time = 0;
  let completedCount = 0;
  let memoryStatesOverTime = [];

  function saveStateChangeSnapshot(currentTime, eventLabel) {
      memoryStatesOverTime.push({
          time: currentTime,
          event: eventLabel,
          partitions: JSON.parse(JSON.stringify(partitions)),
          totalMem: totalMem,
          memAlgo: memAlgo
      });
  }

  let currentRunningProcess = null;
  let quantumUsed = 0;
  let protectionLoop = 0;

  // Cycle-by-cycle execution loop
  while (completedCount < initialProcesses.length && protectionLoop < 1000) {
      protectionLoop++;
      let stateChangedThisTick = false;
      let eventLabels = [];

      // 1. Terminate Finished Processes & Free Memory FIRST
      let newlyFinished = initialProcesses.filter(p => p.allocatedPartitionIndex !== -1 && p.remainingBurst === 0 && p.finishTime === -1);
      
      newlyFinished.forEach(p => {
          completedCount++;
          p.finishTime = time;
          if(currentRunningProcess && currentRunningProcess.id === p.id) {
              currentRunningProcess = null;
              quantumUsed = 0;
          }
          
          let targetIdx = partitions.findIndex(part => part.residentProcess === p.id);
          if (targetIdx !== -1) {
              partitions[targetIdx].residentProcess = null;
              partitions[targetIdx].used = 0;
              
              if (memAlgo === 'MVT') { // Immediate Coalescing
                  if (targetIdx + 1 < partitions.length && partitions[targetIdx + 1].residentProcess === null) {
                      partitions[targetIdx].size += partitions[targetIdx + 1].size;
                      partitions.splice(targetIdx + 1, 1);
                  }
                  if (targetIdx - 1 >= 0 && partitions[targetIdx - 1].residentProcess === null) {
                      partitions[targetIdx - 1].size += partitions[targetIdx].size;
                      partitions[targetIdx - 1].start = Math.min(partitions[targetIdx - 1].start, partitions[targetIdx].start);
                      partitions.splice(targetIdx, 1);
                  }
              }
          }
          eventLabels.push(`${p.id} Exits`);
          stateChangedThisTick = true;
      });

      // 2. Memory Admission Phase
      let waitingProcesses = initialProcesses.filter(p => p.arrival <= time && p.allocatedPartitionIndex === -1 && p.finishTime === -1);
      
      waitingProcesses.forEach(p => {
          if (memAlgo === 'MFT') {
              let maxPartitionSize = Math.max(...partitions.filter(part => part.residentProcess !== "SYSTEM_WASTE").map(part => part.size));
              if (p.memReq > maxPartitionSize) {
                  p.finishTime = -2; // Denied
                  completedCount++; 
                  eventLabels.push(`${p.id} Rejected (Too Big)`);
                  stateChangedThisTick = true;
              } else {
                  for (let idx = 0; idx < partitions.length; idx++) {
                      if (partitions[idx].residentProcess === null && partitions[idx].residentProcess !== "SYSTEM_WASTE" && p.memReq <= partitions[idx].size) {
                          partitions[idx].residentProcess = p.id;
                          partitions[idx].used = p.memReq;
                          p.allocatedPartitionIndex = idx;
                          p.memoryArriveTime = time;
                          eventLabels.push(`${p.id} Admitted`);
                          stateChangedThisTick = true;
                          break;
                      }
                  }
              }
          } else { // MVT Allocation Flow
              let admitted = false;
              
              for (let idx = 0; idx < partitions.length; idx++) {
                  if (partitions[idx].residentProcess === null && partitions[idx].size >= p.memReq) {
                      let oldSize = partitions[idx].size;
                      let oldStart = partitions[idx].start;
                      
                      partitions[idx].size = p.memReq;
                      partitions[idx].used = p.memReq;
                      partitions[idx].residentProcess = p.id;
                      p.allocatedPartitionIndex = idx;
                      p.memoryArriveTime = time;
                      
                      if (oldSize > p.memReq) {
                          partitions.splice(idx + 1, 0, { start: oldStart + p.memReq, size: oldSize - p.memReq, used: 0, residentProcess: null });
                      }
                      eventLabels.push(`${p.id} Admitted`);
                      stateChangedThisTick = true;
                      admitted = true;
                      break;
                  }
              }

              // Compaction logic
              if (!admitted && compactionEnabled) {
                  let totalFreeMemory = partitions.filter(part => part.residentProcess === null).reduce((sum, part) => sum + part.size, 0);
                  
                  if (totalFreeMemory >= p.memReq) {
                      let activePartitions = partitions.filter(part => part.residentProcess !== null);
                      let compactedPartitions = [];
                      let currentStart = 0;
                      
                      activePartitions.forEach(part => {
                          part.start = currentStart;
                          compactedPartitions.push(part);
                          currentStart += part.size;
                      });
                      
                      let accumulatedFreeSize = totalMem - currentStart;
                      if (accumulatedFreeSize > 0) {
                          compactedPartitions.push({ start: currentStart, size: accumulatedFreeSize, used: 0, residentProcess: null });
                      }
                      
                      partitions = compactedPartitions;
                      
                      initialProcesses.forEach(proc => {
                          if (proc.allocatedPartitionIndex !== -1 && proc.finishTime === -1) {
                              proc.allocatedPartitionIndex = partitions.findIndex(part => part.residentProcess === proc.id);
                          }
                      });

                      saveStateChangeSnapshot(time, `Compaction Shuffling`);
                      
                      for (let idx = 0; idx < partitions.length; idx++) {
                          if (partitions[idx].residentProcess === null && partitions[idx].size >= p.memReq) {
                              let oldSize = partitions[idx].size;
                              let oldStart = partitions[idx].start;
                              
                              partitions[idx].size = p.memReq;
                              partitions[idx].used = p.memReq;
                              partitions[idx].residentProcess = p.id;
                              p.allocatedPartitionIndex = idx;
                              p.memoryArriveTime = time;
                              
                              if (oldSize > p.memReq) {
                                  partitions.splice(idx + 1, 0, { start: oldStart + p.memReq, size: oldSize - p.memReq, used: 0, residentProcess: null });
                              }
                              eventLabels.push(`${p.id} Admitted`);
                              stateChangedThisTick = true;
                              break;
                          }
                      }
                  }
              }
          }
      });

      if (stateChangedThisTick || time === 0) {
          let label = eventLabels.length > 0 ? eventLabels.join(" | ") : "State Update";
          saveStateChangeSnapshot(time, label);
      }

      if (completedCount === initialProcesses.length) break;

      // 3. CPU Dispatching & Execution
      if (cpuAlgo === 'RR' && currentRunningProcess && quantumUsed >= quantum && currentRunningProcess.remainingBurst > 0) {
          currentRunningProcess = null;
          quantumUsed = 0;
      }

      let readyProcesses = initialProcesses.filter(p => p.allocatedPartitionIndex !== -1 && p.remainingBurst > 0);
      if (!currentRunningProcess && readyProcesses.length > 0) {
          if (cpuAlgo === 'FCFS') {
              readyProcesses.sort((a, b) => a.arrival - b.arrival || a.memoryArriveTime - b.memoryArriveTime);
          }
          currentRunningProcess = readyProcesses[0];
          quantumUsed = 0;
      }

      if (currentRunningProcess) {
          currentRunningProcess.remainingBurst--;
          quantumUsed++;
      }

      time++;
  }

  // Trigger UI updates
  document.getElementById('memoryMetrics').innerText = `Simulation Complete: Executed over ${time} time units using ${memAlgo} Memory Algorithm & ${cpuAlgo} CPU Scheduling.`;
  renderProgressTimeline(memoryStatesOverTime);
  
  // Show Popup
  document.getElementById('popup-overlay').classList.add('show');
}

// Canvas Rendering Patterns
function createHatchPattern(color) {
  const pCanvas = document.createElement('canvas');
  pCanvas.width = 10; pCanvas.height = 10;
  const pCtx = pCanvas.getContext('2d');
  pCtx.strokeStyle = color; pCtx.lineWidth = 1.5;
  pCtx.beginPath(); pCtx.moveTo(0, 10); pCtx.lineTo(10, 0); pCtx.stroke();
  return pCanvas;
}

function renderProgressTimeline(states) {
  const canvas = document.getElementById('timelineCanvas');
  const ctx = canvas.getContext('2d');
  
  const blockWidth = 110;
  const blockSpacing = 65; 
  const columnHeight = 280; // slightly taller for better visibility
  const osHeight = 40;
  
  // Dynamically adjust canvas width to fit all state frames
  canvas.width = Math.max(800, (states.length * (blockWidth + blockSpacing)) + 40);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const freePattern = ctx.createPattern(createHatchPattern('#2d4a68'), 'repeat');
  const fragPattern = ctx.createPattern(createHatchPattern('#8b0000'), 'repeat');

  states.forEach((state, idx) => {
      let xStart = 20 + (idx * (blockWidth + blockSpacing));
      let yStart = 60; 

      // Draw Time Header
      ctx.fillStyle = '#f2e8a4';
      ctx.font = 'bold 16px "Alexandria", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`t = ${state.time}`, xStart + blockWidth / 2, yStart - 25);

      ctx.fillStyle = '#b0cce3';
      ctx.font = '12px "Alexandria", sans-serif';
      ctx.fillText(state.event, xStart + blockWidth / 2, yStart - 8);

      let currentY = yStart;
      
      // Draw Memory Partitions
      state.partitions.forEach(p => {
          let pHeight = (p.size / state.totalMem) * columnHeight;

          // Start Address Text
          ctx.fillStyle = '#ffffff';
          ctx.font = '11px monospace';
          ctx.textAlign = 'left';
          ctx.fillText(p.start, xStart + blockWidth + 5, currentY + 10);

          if (p.residentProcess === "SYSTEM_WASTE") {
              ctx.fillStyle = '#1a1a1e';
              ctx.fillRect(xStart, currentY, blockWidth, pHeight);
              ctx.strokeStyle = '#4c4c4c';
              ctx.strokeRect(xStart, currentY, blockWidth, pHeight);
              ctx.fillStyle = '#888888';
              ctx.font = '10px sans-serif';
              ctx.textAlign = 'center';
              if (pHeight > 15) ctx.fillText(`Waste (${p.size}K)`, xStart + blockWidth / 2, currentY + pHeight / 2 + 4);
          } 
          else if (p.residentProcess === null) {
              ctx.fillStyle = freePattern;
              ctx.fillRect(xStart, currentY, blockWidth, pHeight);
              ctx.strokeStyle = '#4c4c4c';
              ctx.strokeRect(xStart, currentY, blockWidth, pHeight);
              
              if(pHeight > 20) {
                  ctx.fillStyle = '#aaaaaa';
                  ctx.font = '10px sans-serif';
                  ctx.textAlign = 'center';
                  ctx.fillText(`Free (${p.size}K)`, xStart + blockWidth / 2, currentY + pHeight / 2 + 4);
              }
          } else {
              let usedHeight = (p.used / state.totalMem) * columnHeight;
              let fragHeight = pHeight - usedHeight;

              // Process Block
              ctx.fillStyle = 'rgba(176, 204, 227, 0.8)';
              ctx.fillRect(xStart, currentY, blockWidth, usedHeight);
              ctx.strokeStyle = '#ffffff';
              ctx.strokeRect(xStart, currentY, blockWidth, usedHeight);

              ctx.fillStyle = '#1a1a1e';
              ctx.font = 'bold 16px "Alexandria", sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(p.residentProcess, xStart + blockWidth / 2, currentY + usedHeight / 2 + 6);

              // Fragmentation Block
              if (fragHeight > 0.5) {
                  ctx.fillStyle = fragPattern;
                  ctx.fillRect(xStart, currentY + usedHeight, blockWidth, fragHeight);
                  ctx.strokeStyle = '#e94a4a';
                  ctx.strokeRect(xStart, currentY + usedHeight, blockWidth, fragHeight);

                  if (fragHeight > 15) {
                      ctx.fillStyle = '#ff7777';
                      ctx.font = '10px sans-serif';
                      ctx.textAlign = 'center';
                      ctx.fillText(`Frag (${p.size - p.used}K)`, xStart + blockWidth / 2, currentY + usedHeight + fragHeight / 2 + 3);
                  }
              }
          }
          currentY += pHeight;
      });

      // OS Block
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(state.totalMem, xStart + blockWidth + 5, currentY + 5);

      ctx.fillStyle = '#222222';
      ctx.fillRect(xStart, currentY, blockWidth, osHeight);
      ctx.strokeStyle = '#f2e8a4';
      ctx.strokeRect(xStart, currentY, blockWidth, osHeight);

      ctx.fillStyle = '#f2e8a4';
      ctx.font = 'bold 14px "Alexandria", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("OS", xStart + blockWidth / 2, currentY + osHeight / 2 + 5);
      
      ctx.fillStyle = '#888';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Total: ${state.totalMem}K`, xStart + blockWidth / 2, currentY + osHeight + 18);
  });
}