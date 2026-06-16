function processDiskScheduling() {
    // 1. Gather User Inputs
    const initialHead = parseInt(document.getElementById('initial').value);
    const diskEnd = parseInt(document.getElementById('maxTrack').value);
    const algo = document.getElementById('algorithm').value;
    const rawInput = document.getElementById('sequence').value;
    
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
    else if (algo === 'CSCAN') {
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
    else if (algo === 'CLOOK') {
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

    // 3. Calculate Total Head Movement (Structural jumps in CSCAN/CLOOK do not add seek time)
    let totalMovement = 0;
    for (let i = 0; i < fullPath.length - 1; i++) {
        if (algo === 'CSCAN' && fullPath[i] === diskEnd && fullPath[i+1] === 0) continue; 
        if (algo === 'CLOOK' && right.length > 0 && leftAsc.length > 0 && fullPath[i] === right[right.length - 1] && fullPath[i+1] === leftAsc[0]) continue;
        
        totalMovement += Math.abs(fullPath[i] - fullPath[i+1]);
    }

    // Update Text Fields
    document.getElementById('result').innerText = `Total Head Movement: ${totalMovement} tracks`;
    document.getElementById('sequence-display').innerText = `Execution Path: ${fullPath.join(' → ')}`;

    // 4. Render the Canvas Graph
    const canvas = document.getElementById('graphCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const paddingX = 60;
    const paddingY = 60;
    const graphWidth = canvas.width - (paddingX * 2);
    const graphHeight = canvas.height - (paddingY * 1.5);
    const yStep = graphHeight / (fullPath.length - 1);

    // Map track integer positions to Canvas X coordinate boundaries
    function getX(track) {
        return paddingX + (track / diskEnd) * graphWidth;
    }

    // Draw Main Horizontal Line Segment Track Bar
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(paddingX, paddingY - 10);
    ctx.lineTo(paddingX + graphWidth, paddingY - 10);
    ctx.stroke();

    // Dynamically fetch and display all distinct track positions across the segment path bar
    const uniqueTracks = [...new Set([0, initialHead, ...requests, diskEnd])].sort((a,b) => a - b);
    
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'center';

    uniqueTracks.forEach(track => {
        const textX = getX(track);
        // Draw small track notch line
        ctx.strokeStyle = '#555';
        ctx.beginPath();
        ctx.moveTo(textX, paddingY - 15);
        ctx.lineTo(textX, paddingY - 5);
        ctx.stroke();

        // Style specific track highlights
        if (track === initialHead) {
            ctx.fillStyle = '#d19a66'; // Highlight start track label
        } else if (track === 0 || track === diskEnd) {
            ctx.fillStyle = '#888';
        } else {
            ctx.fillStyle = '#ffffff';
        }
        ctx.fillText(track.toString(), textX, paddingY - 22);
    });

    // Reset settings for drawing path vectors
    ctx.lineWidth = 1.5;

    // Draw Chronological Path Loop
    for (let i = 0; i < fullPath.length; i++) {
        const currentX = getX(fullPath[i]);
        const currentY = paddingY + 15 + (i * yStep);

        // Render point vertex dot
        ctx.fillStyle = (i === 0) ? '#d19a66' : '#ffffff';
        ctx.beginPath();
        ctx.arc(currentX, currentY, i === 0 ? 4 : 3, 0, 2 * Math.PI);
        ctx.fill();

        // Draw structural line to next node step position
        if (i < fullPath.length - 1) {
            const nextX = getX(fullPath[i+1]);
            const nextY = paddingY + 15 + ((i + 1) * yStep);

            ctx.beginPath();
            ctx.moveTo(currentX, currentY);
            ctx.lineTo(nextX, nextY);
            
            // Check if line represents a non-seek physical loop jump (C-SCAN/C-LOOK resets)
            const isCScanJump = (algo === 'CSCAN' && fullPath[i] === diskEnd && fullPath[i+1] === 0);
            const isCLookJump = (algo === 'CLOOK' && right.length > 0 && left.length > 0 && fullPath[i] === right[right.length - 1] && fullPath[i+1] === left[left.length - 1]);

            if (isCScanJump || isCLookJump) {
                ctx.setLineDash([4, 4]);
                ctx.strokeStyle = 'rgba(217, 83, 79, 0.5)'; // red dash line
            } else {
                ctx.setLineDash([]);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            }
            ctx.stroke();

            // Compute arrow angle indicators halfway through line vectors
            const midX = (currentX + nextX) / 2;
            const midY = (currentY + nextY) / 2;
            const angle = Math.atan2(nextY - currentY, nextX - currentX);
            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(midX, midY);
            ctx.lineTo(midX - 6 * Math.cos(angle - Math.PI/6), midY - 6 * Math.sin(angle - Math.PI/6));
            ctx.lineTo(midX - 6 * Math.cos(angle + Math.PI/6), midY - 6 * Math.sin(angle + Math.PI/6));
            ctx.fill();
        }
    }
    ctx.setLineDash([]); // clear dash state
}

// Draw initial set default conditions
processDiskScheduling();