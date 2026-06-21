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
  // 1. Gather User Inputs
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

  // Calculate distances to determine closest initial direction
  let distanceToLeft = left.length > 0 ? Math.abs(initialHead - left[0]) : Infinity;
  let distanceToRight = right.length > 0 ? Math.abs(initialHead - right[0]) : Infinity;
  let goLeftFirst = (distanceToLeft <= distanceToRight && left.length > 0) || right.length === 0;

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
      fullPath = [initialHead];
      if (goLeftFirst) {
          fullPath.push(...left);
          fullPath.push(0); 
          fullPath.push(...right); 
      } else {
          fullPath.push(...right);
          fullPath.push(diskEnd); 
          fullPath.push(...left); 
      }
  } 
  else if (algo === 'C-SCAN') {
      fullPath = [initialHead];
      if (goLeftFirst) {
          let rightDesc = [...right].sort((a,b) => b - a);
          fullPath.push(...left);
          fullPath.push(0);
          fullPath.push(diskEnd);
          fullPath.push(...rightDesc);
      } else {
          let leftAsc = [...left].sort((a,b) => a - b);
          fullPath.push(...right);
          fullPath.push(diskEnd);
          fullPath.push(0);
          fullPath.push(...leftAsc);
      }
  }
  else if (algo === 'LOOK') {
      fullPath = [initialHead];
      if (goLeftFirst) {
          fullPath.push(...left);
          fullPath.push(...right);
      } else {
          fullPath.push(...right);
          fullPath.push(...left);
      }
  }
  else if (algo === 'C-LOOK') {
      fullPath = [initialHead];
      if (goLeftFirst) {
          let rightDesc = [...right].sort((a,b) => b - a);
          fullPath.push(...left);
          if (rightDesc.length > 0) {
              fullPath.push(...rightDesc);
          }
      } else {
          let leftAsc = [...left].sort((a,b) => a - b);
          fullPath.push(...right);
          if (leftAsc.length > 0) {
              fullPath.push(...leftAsc);
          }
      }
  }

  // 3. Calculate Total Head Movement & Generate Equations array
  let totalMovement = 0;
  let equations = [];
  
  for (let i = 0; i < fullPath.length - 1; i++) {
      const isCScanJump = (algo === 'C-SCAN' && ((fullPath[i] === 0 && fullPath[i+1] === diskEnd) || (fullPath[i] === diskEnd && fullPath[i+1] === 0)));
      
      let isCLookJump = false;
      if (algo === 'C-LOOK' && left.length > 0 && right.length > 0) {
          if (goLeftFirst) {
              isCLookJump = (fullPath[i] === left[left.length - 1] && fullPath[i+1] === right[right.length - 1]);
          } else {
              isCLookJump = (fullPath[i] === right[right.length - 1] && fullPath[i+1] === left[left.length - 1]);
          }
      }

      if (isCScanJump || isCLookJump) {
          equations.push(`<span style="color: rgba(233, 74, 74, 0.9); font-size: 13px;">Jump ${fullPath[i]} ➔ ${fullPath[i+1]} (0)</span>`);
          continue;
      }
      
      let big = Math.max(fullPath[i], fullPath[i+1]);
      let small = Math.min(fullPath[i], fullPath[i+1]);
      let diff = big - small;
      
      totalMovement += diff;
      equations.push(`${big} - ${small} = <b>${diff}</b>`);
  }

  // Split equations array into 2 columns if it gets reasonably long
  let col1HTML = "";
  let col2HTML = "";
  let half = Math.ceil(equations.length / 2);

  for (let i = 0; i < equations.length; i++) {
      if (i < half) {
          col1HTML += `<div style="margin-bottom: 5px;">${equations[i]}</div>`;
      } else {
          col2HTML += `<div style="margin-bottom: 5px;">${equations[i]}</div>`;
      }
  }

  // 4. Inject Sorted Results into the Premium UI Modal Container
  const averagesContainer = document.getElementById('averages');
  averagesContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; gap: 20px; padding: 10px 0;">
          
          <div style="text-align: center; width: 100%;">
              <span style="color: rgba(255,255,255,0.5); font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Execution Path</span>
              <p style="font-size: 18px; font-weight: bold; margin: 8px 0 0 0; color: #ffffff; letter-spacing: 0.5px;">${fullPath.join(' ➔ ')}</p>
          </div>
          
          <div style="width: 100%; max-width: 480px; margin: 0 auto;">
              <div style="font-family: monospace; font-size: 15px; color: #ffffff; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: left;">
                  <div style="line-height: 1.6; text-align: right;">${col1HTML}</div>
                  <div style="line-height: 1.6; text-align: left;">${col2HTML || ''}</div>
              </div>
          </div>
          
          <div style="text-align: center; width: 100%; margin-top: 5px;">
              <p style="font-size: 18px; color: #ffffff; margin: 0; font-weight: 500; letter-spacing: 0.5px;">
                  Total Head Movement = <span style="color: #b0cce3; font-weight: bold;">${totalMovement}</span>
              </p>
          </div>

      </div>
  `;

  // 5. Render the Canvas Graph
  const ganttBlocks = document.getElementById('gantt-blocks');
  ganttBlocks.innerHTML = ''; 
  ganttBlocks.style.display = 'flex';
  ganttBlocks.style.justifyContent = 'center';
  ganttBlocks.style.backgroundColor = 'transparent';
  ganttBlocks.style.border = 'none';

  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = Math.max(300, fullPath.length * 40 + 100); 
  canvas.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
  canvas.style.borderRadius = '10px';
  canvas.style.border = '1px solid rgba(255, 255, 255, 0.1)';
  ganttBlocks.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  
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
          ctx.fillStyle = '#f2e8a4'; 
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
          
          const isCScanJump = (algo === 'C-SCAN' && ((fullPath[i] === 0 && fullPath[i+1] === diskEnd) || (fullPath[i] === diskEnd && fullPath[i+1] === 0)));
          
          let isCLookJump = false;
          if (algo === 'C-LOOK' && left.length > 0 && right.length > 0) {
              if (goLeftFirst) {
                  isCLookJump = (fullPath[i] === left[left.length - 1] && fullPath[i+1] === right[right.length - 1]);
              } else {
                  isCLookJump = (fullPath[i] === right[right.length - 1] && fullPath[i+1] === left[left.length - 1]);
              }
          }

          if (isCScanJump || isCLookJump) {
              ctx.setLineDash([6, 6]);
              ctx.strokeStyle = 'rgba(233, 74, 74, 0.6)'; 
          } else {
              ctx.setLineDash([]);
              ctx.strokeStyle = 'rgba(176, 204, 227, 0.8)'; 
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