document.addEventListener('DOMContentLoaded', () => {
  // Hook up the Compute button
  const computeBtn = document.getElementById('compute');
  if (computeBtn) {
      computeBtn.addEventListener('click', processDiskScheduling);
  }

  // Close popup when clicking outside the modal content
  const popupOverlay = document.getElementById('popup-overlay');
  if (popupOverlay) {
      popupOverlay.addEventListener('click', (e) => {
          if (e.target === popupOverlay) {
              popupOverlay.classList.remove('show');
          }
      });
  }
});

function processDiskScheduling() {
  // 1. Gather User Inputs (Updated IDs to match disk.html)
  const initialHead = parseInt(document.getElementById('startTrack').value);
  const diskEnd = parseInt(document.getElementById('maxTrack').value);
  const algo = document.getElementById('algorithm').value;
  const rawInput = document.getElementById('sequence').value;
  
  if (!algo) {
      alert("Please select a Disk Scheduling Algorithm.");
      return;
  }

  let requests = rawInput.split(',')
                         .map(num => parseInt(num.trim()))
                         .filter(num => !isNaN(num) && num >= 0 && num <= diskEnd);

  if (isNaN(initialHead) || isNaN(diskEnd) || initialHead > diskEnd) {
      alert("Please ensure valid numbers. Current Track cannot exceed the Segment End Point.");
      return;
  }

  let fullPath = [];

  // Separate requests into lower and higher tracks
  let left = requests.filter(r => r < initialHead).sort((a,b) => b - a); // descending
  let right = requests.filter(r => r >= initialHead).sort((a,b) => a - b); // ascending

  // 2. Compute path based on chosen Algorithm
  if (algo === 'FCFS') {
      fullPath = [initialHead, ...requests];
  } 
  else if (algo === 'SSTF') {
      fullPath = [initialHead];
      let remaining = [...requests];
      let current = initialHead;
      while (remaining.length > 0) {
          let closestIdx = 0;
          let minDistance = Math.abs(remaining[0] - current);
          for (let i = 1; i < remaining.length; i++) {
              let dist = Math.abs(remaining[i] - current);
              if (dist < minDistance) {
                  minDistance = dist;
                  closestIdx = i;
              }
          }
          current = remaining[closestIdx];
          fullPath.push(current);
          remaining.splice(closestIdx, 1);
      }
  } 
  else if (algo === 'SCAN') {
      // Standard down direction, forcing an edge hit at 0
      fullPath = [initialHead];
      fullPath.push(...left);
      if (left.length > 0 || initialHead > 0) fullPath.push(0);
      fullPath.push(...right);
  } 
  else if (algo === 'C-SCAN') {
      // Standard up direction, hits diskEnd, wraps to 0, then finishes
      fullPath = [initialHead];
      let leftAsc = [...left].sort((a,b) => a - b);
      fullPath.push(...right);
      fullPath.push(diskEnd);
      fullPath.push(0);
      fullPath.push(...leftAsc);
  }
  else if (algo === 'LOOK') {
      // Reverses directly at the lowest/highest requested item without hitting 0 or diskEnd
      fullPath = [initialHead];
      // Defaulting down standard direction if requests exist below head
      if (left.length > 0) {
          fullPath.push(...left);
          fullPath.push(...right);
      } else {
          fullPath.push(...right);
      }
  }
  else if (algo === 'C-LOOK') {
      // Loops up to highest requested item, jumps back to lowest requested item
      fullPath = [initialHead];
      let leftAsc = [...left].sort((a,b) => a - b);
      if (right.length > 0) {
          fullPath.push(...right);
          fullPath.push(...leftAsc);
      } else {
          fullPath.push(...leftAsc);
      }
  }

  // 3. Calculate Total Head Movement
  let totalMovement = 0;
  for (let i = 0; i < fullPath.length - 1; i++) {
      if (algo === 'C-SCAN' && fullPath[i] === diskEnd && fullPath[i+1] === 0) continue; 
      if (algo === 'C-LOOK' && right.length > 0 && leftAsc.length > 0 && fullPath[i] === right[right.length - 1] && fullPath[i+1] === leftAsc[0]) continue;
      
      totalMovement += Math.abs(fullPath[i] - fullPath[i+1]);
  }

  // 4. Inject Results into the Premium UI Modal
  const averagesContainer = document.getElementById('averages');
  averagesContainer.innerHTML = `
      <p>Total Head Movement: <b>${totalMovement} Tracks</b></p>
      <p>Execution Path: <b>${fullPath.join(' → ')}</b></p>
  `;

  // 5. Render the Canvas Graph
  const ganttBlocks = document.getElementById('gantt-blocks');
  ganttBlocks.innerHTML = ''; // Clear previous graph
  ganttBlocks.style.display = 'flex';
  ganttBlocks.style.justifyContent = 'center';
  ganttBlocks.style.backgroundColor = 'transparent';
  ganttBlocks.style.border = 'none';

  // Create canvas dynamically
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = Math.max(300, fullPath.length * 40 + 100); // Scale height based on points
  canvas.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
  canvas.style.borderRadius = '10px';
  canvas.style.border = '1px solid rgba(255, 255, 255, 0.1)';
  ganttBlocks.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  
  // Graph Settings
  const paddingX = 60;
  const paddingY = 60;
  const graphWidth = canvas.width - (paddingX * 2);
  const graphHeight = canvas.height - (paddingY * 1.5);
  const yStep = graphHeight / Math.max(1, (fullPath.length - 1));

  function getX(track) {
      return paddingX + (track / diskEnd) * graphWidth;
  }

  // Draw Main Horizontal Track Bar
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(paddingX, paddingY - 10);
  ctx.lineTo(paddingX + graphWidth, paddingY - 10);
  ctx.stroke();

  const uniqueTracks = [...new Set([0, initialHead, ...requests, diskEnd])].sort((a,b) => a - b);
  
  ctx.font = '12px "Alexandria", sans-serif';
  ctx.textAlign = 'center';

  uniqueTracks.forEach(track => {
      const textX = getX(track);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(textX, paddingY - 15);
      ctx.lineTo(textX, paddingY - 5);
      ctx.stroke();

      if (track === initialHead) {
          ctx.fillStyle = '#f2e8a4'; // Premium gold for start
      } else if (track === 0 || track === diskEnd) {
          ctx.fillStyle = '#888888';
      } else {
          ctx.fillStyle = '#ffffff';
      }
      ctx.fillText(track.toString(), textX, paddingY - 25);
  });

  ctx.lineWidth = 2;

  // Draw Chronological Path
  for (let i = 0; i < fullPath.length; i++) {
      const currentX = getX(fullPath[i]);
      const currentY = paddingY + 15 + (i * yStep);

      ctx.fillStyle = (i === 0) ? '#f2e8a4' : '#b0cce3';
      ctx.beginPath();
      ctx.arc(currentX, currentY, i === 0 ? 6 : 4, 0, 2 * Math.PI);
      ctx.fill();

      if (i < fullPath.length - 1) {
          const nextX = getX(fullPath[i+1]);
          const nextY = paddingY + 15 + ((i + 1) * yStep);

          ctx.beginPath();
          ctx.moveTo(currentX, currentY);
          ctx.lineTo(nextX, nextY);
          
          const isCScanJump = (algo === 'C-SCAN' && fullPath[i] === diskEnd && fullPath[i+1] === 0);
          const isCLookJump = (algo === 'C-LOOK' && right.length > 0 && left.length > 0 && fullPath[i] === right[right.length - 1] && fullPath[i+1] === leftAsc[0]);

          if (isCScanJump || isCLookJump) {
              ctx.setLineDash([6, 6]);
              ctx.strokeStyle = 'rgba(233, 74, 74, 0.6)'; // Red dash for structural resets
          } else {
              ctx.setLineDash([]);
              ctx.strokeStyle = 'rgba(176, 204, 227, 0.8)'; // Soft blue for seek paths
          }
          ctx.stroke();

          // Arrow logic
          const midX = (currentX + nextX) / 2;
          const midY = (currentY + nextY) / 2;
          const angle = Math.atan2(nextY - currentY, nextX - currentX);
          
          ctx.fillStyle = 'rgba(176, 204, 227, 1)';
          ctx.beginPath();
          ctx.moveTo(midX, midY);
          ctx.lineTo(midX - 8 * Math.cos(angle - Math.PI/6), midY - 8 * Math.sin(angle - Math.PI/6));
          ctx.lineTo(midX - 8 * Math.cos(angle + Math.PI/6), midY - 8 * Math.sin(angle + Math.PI/6));
          ctx.fill();
      }
  }
  ctx.setLineDash([]); 

  // 6. Trigger the Popup
  document.getElementById('popup-overlay').classList.add('show');
}