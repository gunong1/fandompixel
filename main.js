const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
// Side Panel Elements
const sidePanel = document.getElementById('side-panel');
const areaIdText = document.getElementById('area-id');
const pixelInfo = document.getElementById('pixel-info');
const statusTag = document.getElementById('status-tag');
const ownerNickname = document.getElementById('owner-nickname');
const idolGroup = document.getElementById('idol-group');
const purchaseForm = document.getElementById('purchase-form');
const nicknameInput = document.getElementById('nickname-input');
const idolSelect = document.getElementById('idol-select');
const subscribeButton = document.getElementById('subscribe-button');

const debugOverlay = document.getElementById('debug-overlay');
function debugLog(message) {
    if(debugOverlay) {
        const p = document.createElement('p');
        p.textContent = message;
        debugOverlay.appendChild(p);
        debugOverlay.scrollTop = debugOverlay.scrollHeight; // Scroll to bottom
    }
    console.log(message);
}


const socket = io();

const WORLD_SIZE = 3162;
const GRID_SIZE = 20;
let scale = 0.2;
let offsetX = window.innerWidth / 2 - (WORLD_SIZE * scale) / 2;
let offsetY = window.innerHeight / 2 - (WORLD_SIZE * scale) / 2;

let pixels = [];
let selectedPixels = []; // Array for multiple selected pixels
let isDraggingCanvas = false; // Flag for panning the canvas
let isSelectingPixels = false; // Flag for dragging to select pixels
let selectionStartX = 0;
let selectionStartY = 0;
let selectionEndX = 0;
let selectionEndY = 0;

// --- Idol Group Info ---
const idolInfo = {
    'BTS': { color: 'rgba(123, 63, 242, 0.7)', initials: 'BTS' },
    'Blackpink': { color: 'rgba(255, 105, 180, 0.7)', initials: 'BP' },
    'TWICE': { color: 'rgba(255, 209, 0, 0.7)', initials: 'TW' },
    'NewJeans': { color: 'rgba(50, 205, 50, 0.7)', initials: 'NJ' }
};

function draw() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = '#0a0f19';
    ctx.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

    // Grid (only when zoomed in)
    if (scale > 1.5) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
        for (let i = 0; i <= WORLD_SIZE; i += GRID_SIZE) {
            ctx.moveTo(i, 0); ctx.lineTo(i, WORLD_SIZE);
            ctx.moveTo(0, i); ctx.lineTo(WORLD_SIZE, i);
        }
        ctx.stroke();
    }

    // Draw all owned pixels
    pixels.forEach(pixel => {
        const groupInfo = idolInfo[pixel.idol_group_name] || { color: pixel.color, initials: '?' };
        ctx.fillStyle = groupInfo.color;
        ctx.fillRect(pixel.x, pixel.y, GRID_SIZE, GRID_SIZE);
        
        // Draw initials if zoomed in enough
        if (scale > 3) {
            ctx.fillStyle = 'white';
            ctx.font = `bold ${GRID_SIZE / 2}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(groupInfo.initials, pixel.x + GRID_SIZE / 2, pixel.y + GRID_SIZE / 2);
        }
    });

    // Draw selection rectangle if currently selecting
    if (isSelectingPixels && selectionStartX !== selectionEndX && selectionStartY !== selectionEndY) {
        ctx.strokeStyle = 'lime';
        ctx.lineWidth = 2 / scale;
        ctx.strokeRect(selectionStartX, selectionStartY, selectionEndX - selectionStartX, selectionEndY - selectionStartY);
        ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
        ctx.fillRect(selectionStartX, selectionStartY, selectionEndX - selectionStartX, selectionEndY - selectionStartY);
    }
    // Draw visual indicator for selected pixels (after selection is finalized)
    selectedPixels.forEach(p => {
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 2 / scale;
        ctx.strokeRect(p.x, p.y, GRID_SIZE, GRID_SIZE);
    });

    ctx.restore();
    updateMinimap();
}

// --- Data Fetching and Socket Events ---

fetch('/api/pixels')
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    })
    .then(initialPixels => {
        pixels = initialPixels;
        draw();
    })
    .catch(e => console.error('Error fetching initial pixels:', e));

socket.on('pixel_update', (pixel) => {
    const index = pixels.findIndex(p => p.x === pixel.x && p.y === pixel.y);
    if (index > -1) {
        pixels[index] = pixel;
    } else {
        pixels.push(pixel);
    }
    draw();
});


// --- User Interactions (Dragging and Selecting) ---

let lastMouseX, lastMouseY;

canvas.onmousedown = (e) => {
    debugLog(`--- MOUSE DOWN ---`);
    debugLog(`e.ctrlKey: ${e.ctrlKey}`);
    debugLog(`e.target: ${e.target.tagName} (id: ${e.target.id || 'none'})`);

    // If Ctrl key is pressed, start panning the canvas
    if (e.ctrlKey) {
        isDraggingCanvas = true;
        isSelectingPixels = false; // Ensure selection mode is off
        debugLog('Action: Starting Canvas Pan.');
    } else { // Normal left-click, start selection drag
        isSelectingPixels = true;
        isDraggingCanvas = false; // Ensure dragging mode is off
        const worldX = (e.clientX - offsetX) / scale;
        const worldY = (e.clientY - offsetY) / scale;
        selectionStartX = Math.floor(worldX / GRID_SIZE) * GRID_SIZE;
        selectionStartY = Math.floor(worldY / GRID_SIZE) * GRID_SIZE;
        selectionEndX = selectionStartX; // Initialize end with start
        selectionEndY = selectionStartY;
        selectedPixels = []; // Clear previous selection
        sidePanel.style.display = 'none'; // Hide panel during selection
        debugLog(`Action: Starting Pixel Selection. Start: (${selectionStartX}, ${selectionStartY})`);
    }
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
};

window.onmousemove = (e) => {
    if (isDraggingCanvas) {
        offsetX += e.clientX - lastMouseX;
        offsetY += e.clientY - lastMouseY;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        draw();
    } else if (isSelectingPixels) {
        const worldX = (e.clientX - offsetX) / scale;
        const worldY = (e.clientY - offsetY) / scale;
        selectionEndX = Math.floor(worldX / GRID_SIZE) * GRID_SIZE;
        selectionEndY = Math.floor(worldY / GRID_SIZE) * GRID_SIZE;
        draw();
    }
};

window.onmouseup = (e) => {
    debugLog(`--- MOUSE UP ---`);
    debugLog(`isDraggingCanvas: ${isDraggingCanvas}`);
    debugLog(`isSelectingPixels: ${isSelectingPixels}`);
    debugLog(`e.target: ${e.target.tagName} (id: ${e.target.id || 'none'})`);

    if (isDraggingCanvas) { // Finished dragging
        isDraggingCanvas = false;
        debugLog('Action: Finished Canvas Pan.');
        // After drag, if no selection happened, hide panel
        if (selectedPixels.length === 0) {
            sidePanel.style.display = 'none';
            debugLog('Action: Hiding side panel (no active selection after pan).');
        }
        return; // Don't proceed to click/selection logic if it was a pan drag
    }

    // Ignore clicks inside the side panel to allow interaction with form elements
    if (sidePanel.contains(e.target)) {
        debugLog(`Click inside side panel. Ignoring.`);
        return;
    }

    if (isSelectingPixels) { // Finished selecting
        isSelectingPixels = false;
        
        // Normalize selection rectangle (ensure positive width/height)
        const normalizedStartX = Math.min(selectionStartX, selectionEndX);
        const normalizedStartY = Math.min(selectionStartY, selectionEndY);
        const normalizedEndX = Math.max(selectionStartX, selectionEndX);
        const normalizedEndY = Math.max(selectionStartY, selectionEndY);

        const rectWidth = normalizedEndX - normalizedStartX;
        const rectHeight = normalizedEndY - normalizedStartY;

        debugLog(`Selection Rect World Coords: (${normalizedStartX},${normalizedStartY}) to (${normalizedEndX},${normalizedEndY})`);
        debugLog(`Selection Rect Size (W x H): ${rectWidth} x ${rectHeight}`);

        selectedPixels = [];
        // If a valid rectangle was drawn (more than a single pixel)
        if (rectWidth > 0 && rectHeight > 0) {
            debugLog('Type: Multi-pixel selection (dragged).');
            for (let x = normalizedStartX; x < normalizedEndX; x += GRID_SIZE) {
                for (let y = normalizedStartY; y < normalizedEndY; y += GRID_SIZE) {
                    // Ensure x, y are within WORLD_SIZE and only select unowned pixels
                    if (x >= 0 && x < WORLD_SIZE && y >= 0 && y < WORLD_SIZE) {
                        const existingPixel = pixels.find(p => p.x === x && p.y === y);
                        if (!existingPixel) {
                            selectedPixels.push({ x, y });
                        }
                    }
                }
            }
        } else { // Handle single click or very small drag as a single pixel selection
            debugLog('Type: Single pixel selection (click or minimal drag, isSelectingPixels was true).');
             const worldX = (e.clientX - offsetX) / scale; // Recalculate based on current mouse pos for click
             const worldY = (e.clientY - offsetY) / scale;
             if (worldX >= 0 && worldX < WORLD_SIZE && worldY >= 0 && worldY < WORLD_SIZE) {
                 const gx = Math.floor(worldX / GRID_SIZE) * GRID_SIZE;
                 const gy = Math.floor(worldY / GRID_SIZE) * GRID_SIZE;
                 const existingPixel = pixels.find(p => p.x === gx && p.y === gy);
                 if (!existingPixel) { // Only select unowned single pixel
                    selectedPixels.push({ x: gx, y: gy });
                 }
             }
        }
        
        debugLog(`Selected Pixels Count: ${selectedPixels.length}`);
        if (selectedPixels.length > 0) {
            debugLog(`First selected pixel: X:${selectedPixels[0].x}, Y:${selectedPixels[0].y}`);
        }

        updateSidePanel(); // Update panel based on selectedPixels
        if (selectedPixels.length > 0) {
            sidePanel.style.display = 'block';
            debugLog('Action: Showing side panel.');
        } else {
            sidePanel.style.display = 'none';
            debugLog('Action: Hiding side panel (no pixels selected).');
        }
        draw(); // Redraw with selected pixels highlighted
        return; // Don't proceed to regular click logic
    }
    
    // If not dragging and not selecting, then it's a regular click (possibly outside canvas)
    // This part handles single clicks on owned pixels or clicks outside everything to clear selection
    if (e.target === canvas) { // Clicked directly on canvas (not part of drag/selection)
        const worldX = (e.clientX - offsetX) / scale;
        const worldY = (e.clientY - offsetY) / scale;
        debugLog(`Client Coords: (${e.clientX}, ${e.clientY})`);
        debugLog(`Offset: (${offsetX.toFixed(2)}, ${offsetY.toFixed(2)})`);
        debugLog(`Scale: ${scale.toFixed(2)}`);
        debugLog(`Calculated World Coords: (${worldX.toFixed(2)}, ${worldY.toFixed(2)})`);


        if (worldX >= 0 && worldX < WORLD_SIZE && worldY >= 0 && worldY < WORLD_SIZE) {
            debugLog('Result: Click is INSIDE world boundaries (single click).');
            const gx = Math.floor(worldX / GRID_SIZE);
            const gy = Math.floor(worldY / GRID_SIZE);
            const clickedX = gx * GRID_SIZE;
            const clickedY = gy * GRID_SIZE;

            selectedPixels = []; // Clear previous selection
            const existingPixel = pixels.find(p => p.x === clickedX && p.y === clickedY);
            
            if (existingPixel) { // If single clicked an owned pixel, show its info
                selectedPixels.push(existingPixel); // Temporarily add for panel display
                updateSidePanel(existingPixel); // Pass the owned pixel to display its info
                sidePanel.style.display = 'block';
                debugLog(`Action: Showing info for owned pixel (${clickedX}, ${clickedY}).`);
            } else { // If single clicked an unowned pixel, select it
                selectedPixels.push({ x: clickedX, y: clickedY });
                updateSidePanel(); // Update panel with the single selected unowned pixel
                sidePanel.style.display = 'block';
                debugLog(`Action: Selecting unowned pixel (${clickedX}, ${clickedY}).`);
            }
            draw();
        } else { // Click on canvas but outside world boundaries
            sidePanel.style.display = 'none';
            selectedPixels = [];
            draw();
            debugLog('Action: Hiding side panel (canvas click outside world).');
        }
    } else if (!sidePanel.contains(e.target)) { // Clicked outside canvas AND outside side panel
        sidePanel.style.display = 'none';
        selectedPixels = [];
        draw();
        debugLog('Action: Hiding side panel (click outside canvas and sidepanel).');
    }
};


canvas.onclick = (e) => {
    // This event listener will be primarily for single clicks
    // Logic for selection is now handled in onmouseup if isSelectingPixels was true
    // If it was a drag, isDraggingCanvas would have been true.
    // So if neither is true, it's a regular single click on canvas.
    if (e.target !== canvas || isDraggingCanvas || isSelectingPixels) { // If not on canvas or part of a drag/selection
        return;
    }

    const worldX = (e.clientX - offsetX) / scale;
    const worldY = (e.clientY - offsetY) / scale;

    if (worldX >= 0 && worldX < WORLD_SIZE && worldY >= 0 && worldY < WORLD_SIZE) {
        const gx = Math.floor(worldX / GRID_SIZE);
        const gy = Math.floor(worldY / GRID_SIZE);
        const clickedX = gx * GRID_SIZE;
        const clickedY = gy * GRID_SIZE;

        selectedPixels = []; // Clear previous selection
        const existingPixel = pixels.find(p => p.x === clickedX && p.y === clickedY);
        
        if (existingPixel) { // If single clicked an owned pixel, show its info
            selectedPixels.push(existingPixel); // Temporarily add for panel display
            updateSidePanel(existingPixel); // Pass the owned pixel to display its info
            sidePanel.style.display = 'block';
        } else { // If single clicked an unowned pixel, select it
            selectedPixels.push({ x: clickedX, y: clickedY });
            updateSidePanel(); // Update panel with the single selected unowned pixel
            sidePanel.style.display = 'block';
        }
        draw();
    } else {
        sidePanel.style.display = 'none';
        selectedPixels = [];
        draw();
    }
};


// Function to get selected pixels within a rectangle (not actively used in current logic but useful)
function getPixelsInSelection(rectX, rectY, rectWidth, rectHeight) {
    const newSelected = [];
    for (let x = rectX; x < rectX + rectWidth; x += GRID_SIZE) {
        for (let y = rectY; y < rectY + rectHeight; y += GRID_SIZE) {
            // Ensure x, y are within WORLD_SIZE and only select unowned pixels
            if (x >= 0 && x < WORLD_SIZE && y >= 0 && y < WORLD_SIZE) {
                const existingPixel = pixels.find(p => p.x === x && p.y === y);
                if (!existingPixel) {
                    newSelected.push({ x, y });
                }
            }
        }
    }
    return newSelected;
}


// Modified updateSidePanel to handle multiple selections
function updateSidePanel(singleOwnedPixel = null) {
    const totalSelected = selectedPixels.length;
    
    // Default to hide all purchase related things
    pixelInfo.style.display = 'none';
    purchaseForm.style.display = 'none';

    if (totalSelected > 0) { // Pixels selected for purchase
        // Check if all selected pixels are owned. If so, display info about first one.
        const allOwned = selectedPixels.every(p => pixels.some(ep => ep.x === p.x && ep.y === p.y));
        if (allOwned && selectedPixels.length === 1 && singleOwnedPixel) {
            // It's a single owned pixel clicked, display its info
            pixelInfo.style.display = 'block';
            statusTag.textContent = '소유자 있음';
            statusTag.style.background = '#ff4d4d';
            ownerNickname.textContent = singleOwnedPixel.owner_nickname;
            idolGroup.textContent = singleOwnedPixel.idol_group_name;
            areaIdText.innerText = `Area #${singleOwnedPixel.x/GRID_SIZE}-${singleOwnedPixel.y/GRID_SIZE}`; // Display area info for single owned
        } else if (allOwned) {
            // If multiple selected and all are owned, display generic message
            pixelInfo.style.display = 'block';
            statusTag.textContent = '선택된 모든 픽셀은 이미 소유자 있음';
            statusTag.style.background = '#ff4d4d';
            ownerNickname.textContent = '-';
            idolGroup.textContent = '-';
            areaIdText.innerText = `총 ${totalSelected}개의 소유된 픽셀`;
        }
        else { // Some or all are available for purchase
            purchaseForm.style.display = 'block';
            statusTag.textContent = `${totalSelected} 픽셀 선택됨`;
            statusTag.style.background = '#00d4ff';
            areaIdText.innerText = `총 구독료: ₩ ${(totalSelected * 1000).toLocaleString()}`;
            
            // Reset nickname/idol inputs for fresh purchase
            // nicknameInput.value = ''; // Keep previous nickname
            // idolSelect.value = 'BTS'; // Keep previous idol
        }
    } else { // No pixels selected or available single pixel
        sidePanel.style.display = 'none';
    }
    // Update areaIdText to reflect current selection or default
    if (selectedPixels.length === 0 && !singleOwnedPixel) {
        areaIdText.innerText = `Area #??`; // Default state
    }
}


subscribeButton.onclick = () => {
    const nickname = nicknameInput.value.trim();
    const idolGroupName = idolSelect.value;

    if (!nickname) {
        alert('닉네임을 입력해주세요.');
        return;
    }
    if (selectedPixels.length === 0) {
        alert('선택된 픽셀이 없습니다.');
        return;
    }

    const groupInfo = idolInfo[idolGroupName];

    selectedPixels.forEach(pixel => {
        socket.emit('new_pixel', {
            x: pixel.x,
            y: pixel.y,
            color: groupInfo.color,
            idol_group_name: idolGroupName,
            owner_nickname: nickname
        });
    });

    sidePanel.style.display = 'none';
    nicknameInput.value = '';
    selectedPixels = []; // Clear selection after purchase
    draw(); // Redraw to clear selection highlights
};

canvas.onwheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const mouseX = e.clientX - offsetX;
    const mouseY = e.clientY - offsetY;
    
    offsetX -= (mouseX * delta - mouseX);
    offsetY -= (mouseY * delta - mouseY);
    scale *= delta;
    scale = Math.min(Math.max(scale, 0.05), 20);
    draw();
};

function updateMinimap() {
    const mv = document.getElementById('minimap-view');
    const mmScale = 180 / WORLD_SIZE;
    mv.style.width = (window.innerWidth / scale * mmScale) + 'px';
    mv.style.height = (window.innerHeight / scale * mmScale) + 'px';
    mv.style.left = (-offsetX / scale * mmScale) + 'px';
    mv.style.top = (-offsetY / scale * mmScale) + 'px';
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        scale = 0.2;
        offsetX = window.innerWidth / 2 - (WORLD_SIZE * scale) / 2;
        offsetY = window.innerHeight / 2 - (WORLD_SIZE * scale) / 2;
        draw();
    }
});

window.onresize = draw;
