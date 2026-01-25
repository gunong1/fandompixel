const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
// Side Panel Elements
const sidePanel = document.getElementById('side-panel');
const areaIdText = document.getElementById('area-id');
const pixelInfo = document.getElementById('pixel-info');
const statusTag = document.getElementById('status-tag');
const selectedPixelCountDiv = document.getElementById('selected-pixel-count'); // New: Element for displaying selected pixel count
const ownerNickname = document.getElementById('owner-nickname');
const idolGroup = document.getElementById('idol-group');
const purchaseForm = document.getElementById('purchase-form');
const nicknameInput = document.getElementById('nickname-input');
const idolSelect = document.getElementById('idol-select');
const subscribeButton = document.getElementById('subscribe-button');




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
    if (selectedPixels.length > 0) {
        // Calculate bounding box for all selected pixels
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        selectedPixels.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x + GRID_SIZE);
            maxY = Math.max(maxY, p.y + GRID_SIZE);
        });

        // Draw the bounding box
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 2; // Fixed to 2 for consistent visibility
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        ctx.fillStyle = 'rgba(255, 255, 0, 0.1)'; // Translucent yellow fill
        ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
    }

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

    // If Ctrl key is pressed, start panning the canvas
    if (e.ctrlKey) {
        isDraggingCanvas = true;
        isSelectingPixels = false; // Ensure selection mode is off
    } else { // Normal left-click, start selection drag
        isSelectingPixels = true;
        isDraggingCanvas = false; // Ensure dragging mode is off
        const worldX = (e.clientX - offsetX) / scale;
        const worldY = (e.clientY - offsetY) / scale;
        selectionStartX = Math.floor(worldX / GRID_SIZE) * GRID_SIZE;
        selectionStartY = Math.floor(worldY / GRID_SIZE) * GRID_SIZE;

        // 클램핑: 캔버스 경계를 벗어나지 않도록
        selectionStartX = Math.max(0, Math.min(selectionStartX, WORLD_SIZE));
        selectionStartY = Math.max(0, Math.min(selectionStartY, WORLD_SIZE));

        // Add clamping
        selectionStartX = Math.max(0, Math.min(selectionStartX, WORLD_SIZE - GRID_SIZE));
        selectionStartY = Math.max(0, Math.min(selectionStartY, WORLD_SIZE - GRID_SIZE));
        selectionEndX = selectionStartX; // Initialize end with start
        selectionEndY = selectionStartY;
        selectedPixels = []; // Clear previous selection
        sidePanel.style.display = 'none'; // Hide panel during selection
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

        // 클램핑: 캔버스 경계를 벗어나지 않도록
        selectionEndX = Math.max(0, Math.min(selectionEndX, WORLD_SIZE - GRID_SIZE));
        selectionEndY = Math.max(0, Math.min(selectionEndY, WORLD_SIZE - GRID_SIZE));
        draw();
    }
};

window.onmouseup = (e) => {

    if (isDraggingCanvas) { // Finished dragging
        isDraggingCanvas = false;
        // After drag, if no selection happened, hide panel
        if (selectedPixels.length === 0) {
            sidePanel.style.display = 'none';
        }
        return; // Don't proceed to click/selection logic if it was a pan drag
    }

    // Ignore clicks inside the side panel to allow interaction with form elements
    if (sidePanel.contains(e.target)) {
        return;
    }

    if (isSelectingPixels) { // Finished selecting
        isSelectingPixels = false;
        
        const currentMouseWorldX = (e.clientX - offsetX) / scale;
        const currentMouseWorldY = (e.clientY - offsetY) / scale;

        // Calculate the GRID_SIZE-aligned start coordinate of the pixel where the mouse was released
        let mouseUpPixelStartX = Math.floor(currentMouseWorldX / GRID_SIZE) * GRID_SIZE;
        let mouseUpPixelStartY = Math.floor(currentMouseWorldY / GRID_SIZE) * GRID_SIZE;

        // 클램핑: 캔버스 경계를 벗어나지 않도록
        mouseUpPixelStartX = Math.max(0, Math.min(mouseUpPixelStartX, WORLD_SIZE - GRID_SIZE));
        mouseUpPixelStartY = Math.max(0, Math.min(mouseUpPixelStartY, WORLD_SIZE - GRID_SIZE));

        // Determine the overall start (min) and end (max) pixel start coordinates of the selection rectangle
        const normalizedStartX = Math.min(selectionStartX, mouseUpPixelStartX);
        const normalizedStartY = Math.min(selectionStartY, mouseUpPixelStartY);
        
        // These are the *start coordinates* of the furthest selected pixel.
        const normalizedEndX = Math.max(selectionStartX, mouseUpPixelStartX);
        const normalizedEndY = Math.max(selectionStartY, mouseUpPixelStartY);

        // The rectWidth and rectHeight should reflect the inclusive range.
        // So, from normalizedStartX to normalizedEndX (inclusive) means (normalizedEndX - normalizedStartX + GRID_SIZE)
        const rectWidth = normalizedEndX - normalizedStartX + GRID_SIZE; // Inclusive width
        const rectHeight = normalizedEndY - normalizedStartY + GRID_SIZE; // Inclusive height

        selectedPixels = [];
        // If a valid rectangle was drawn (more than a single pixel)
        if (rectWidth > 0 && rectHeight > 0) {
            // Loop from normalizedStartX up to and *including* normalizedEndX
            for (let x = normalizedStartX; x <= normalizedEndX; x += GRID_SIZE) { // <--- Changed condition
                for (let y = normalizedStartY; y <= normalizedEndY; y += GRID_SIZE) { // <--- Changed condition
                    // Ensure x, y are within WORLD_SIZE and only select pixels
                    if (x >= 0 && x < WORLD_SIZE && y >= 0 && y < WORLD_SIZE) {
                        selectedPixels.push({ x, y });
                    }
                }
            }
        } else { // Handle single click or very small drag as a single pixel selection
             const worldX = (e.clientX - offsetX) / scale; // Recalculate based on current mouse pos for click
             const worldY = (e.clientY - offsetY) / scale;
             if (worldX >= 0 && worldX < WORLD_SIZE && worldY >= 0 && worldY < WORLD_SIZE) {
                 const gx = Math.floor(worldX / GRID_SIZE) * GRID_SIZE;
                 const gy = Math.floor(worldY / GRID_SIZE) * GRID_SIZE;
                 selectedPixels.push({ x: gx, y: gy });
             }
        }
        


        updateSidePanel(); // Update panel based on selectedPixels
        if (selectedPixels.length > 0) {
            sidePanel.style.display = 'block';
        } else {
            sidePanel.style.display = 'none';
        }
        draw(); // Redraw with selected pixels highlighted
        return; // Don't proceed to regular click logic
    }
    
    // If not dragging and not selecting, then it's a regular click (possibly outside canvas)
    // This part handles single clicks on owned pixels or clicks outside everything to clear selection
    if (e.target === canvas) { // Clicked directly on canvas (not part of drag/selection)
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
        } else { // Click on canvas but outside world boundaries
            sidePanel.style.display = 'none';
            selectedPixels = [];
            draw();
        }
    } else if (!sidePanel.contains(e.target)) { // Clicked outside canvas AND outside side panel
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

    if (totalSelected > 0) {
        selectedPixelCountDiv.textContent = `총 ${totalSelected} 픽셀 선택됨`;
        selectedPixelCountDiv.style.display = 'block';
        const ownedInSelection = selectedPixels.filter(p => pixels.some(ep => ep.x === p.x && ep.y === p.y));
        const unownedInSelection = selectedPixels.filter(p => !pixels.some(ep => ep.x === p.x && ep.y === p.y));

        if (unownedInSelection.length > 0) { // There are unowned pixels in the selection
            purchaseForm.style.display = 'block';
            if (ownedInSelection.length > 0) {
                statusTag.textContent = `${unownedInSelection.length} 픽셀 구매 가능 (${ownedInSelection.length}개 소유됨)`;
                statusTag.style.background = '#ff9800'; // Orange for mixed
            } else {
                statusTag.textContent = `${totalSelected} 픽셀 선택됨`;
                statusTag.style.background = '#00d4ff'; // Blue for all unowned
            }
            areaIdText.innerText = `총 구독료: ₩ ${(unownedInSelection.length * 1000).toLocaleString()}`;
        } else if (ownedInSelection.length > 0) { // All selected pixels are owned
            pixelInfo.style.display = 'block';
            statusTag.textContent = '선택된 모든 픽셀은 이미 소유자 있음';
            statusTag.style.background = '#ff4d4d'; // Red for all owned
            ownerNickname.textContent = '-';
            idolGroup.textContent = '-';
            areaIdText.innerText = `총 ${totalSelected}개의 소유된 픽셀`;
            
            // If it's a single owned pixel from a direct click, show its specific info
            if (ownedInSelection.length === 1 && singleOwnedPixel && ownedInSelection[0].x === singleOwnedPixel.x && ownedInSelection[0].y === singleOwnedPixel.y) {
                ownerNickname.textContent = singleOwnedPixel.owner_nickname;
                idolGroup.textContent = singleOwnedPixel.idol_group_name;
                areaIdText.innerText = `Area #${singleOwnedPixel.x/GRID_SIZE}-${singleOwnedPixel.y/GRID_SIZE}`;
            }
        }
    } else { // No pixels selected
        sidePanel.style.display = 'none';
        areaIdText.innerText = `Area #??`; // Default state
        selectedPixelCountDiv.style.display = 'none';
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
