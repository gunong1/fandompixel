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

const socket = io();

const WORLD_SIZE = 3162;
const GRID_SIZE = 20;
let scale = 0.2;
let offsetX = window.innerWidth / 2 - (WORLD_SIZE * scale) / 2;
let offsetY = window.innerHeight / 2 - (WORLD_SIZE * scale) / 2;

let pixels = [];
let selectedPixel = null;

// --- Idol Group Info ---
const idolInfo = {
    'BTS': { color: 'rgba(123, 63, 242, 0.7)', initials: 'BTS' },
    'Blackpink': { color: 'rgba(255, 105, 180, 0.7)', initials: 'BP' },
    'TWICE': { color: 'rgba(255, 209, 0, 0.7)', initials: 'TW' },
    'NewJeans': { color: 'rgba(50, 205, 50, 0.7)', initials: 'NJ' }
};

function draw() {
    // console.log('draw function called');
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
        // console.log('Fetched initial pixels:', initialPixels);
        pixels = initialPixels;
        draw();
    })
    .catch(e => console.error('Error fetching initial pixels:', e));

socket.on('pixel_update', (pixel) => {
    // Check if pixel already exists and update it, otherwise add it.
    const index = pixels.findIndex(p => p.x === pixel.x && p.y === pixel.y);
    if (index > -1) {
        pixels[index] = pixel;
    } else {
        pixels.push(pixel);
    }
    draw();
});


// --- User Interactions ---

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


let isDragging = false;
let lastX, lastY;

canvas.onmousedown = (e) => { isDragging = true; lastX = e.clientX; lastY = e.clientY; };
window.onmousemove = (e) => {
    if (!isDragging) return;
    offsetX += e.clientX - lastX;
    offsetY += e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    draw();
};

window.onmouseup = (e) => {
    if(debugOverlay) {
        debugOverlay.innerHTML = 'Debug Info:'; // Clear previous logs
    }
    debugLog(`--- New Click ---`);
    debugLog(`isDragging: ${isDragging}`);
    debugLog(`e.target: ${e.target.tagName} (id: ${e.target.id || 'none'})`);


    if (isDragging) {
        isDragging = false;
        return;
    }
    
    // Ignore clicks inside the side panel to allow interaction with form elements
    if (sidePanel.contains(e.target)) {
        debugLog(`Click inside side panel. Ignoring.`);
        return;
    }

    // Only process clicks that originated on the main canvas element
    if (e.target !== canvas) {
        debugLog(`Click is NOT on canvas. e.target: ${e.target.tagName}`);
        sidePanel.style.display = 'none'; // Hide panel if click is not on canvas
        selectedPixel = null;
        debugLog('Action: Hiding side panel (not on canvas).');
        return;
    }

    const worldX = (e.clientX - offsetX) / scale;
    const worldY = (e.clientY - offsetY) / scale;
    
    debugLog(`Client Coords: (${e.clientX}, ${e.clientY})`);
    debugLog(`Offset: (${offsetX.toFixed(2)}, ${offsetY.toFixed(2)})`);
    debugLog(`Scale: ${scale.toFixed(2)}`);
    debugLog(`Calculated World Coords: (${worldX.toFixed(2)}, ${worldY.toFixed(2)})`);

    // Check if the click was within the world boundaries
    if (worldX >= 0 && worldX < WORLD_SIZE && worldY >= 0 && worldY < WORLD_SIZE) {
        debugLog('Result: Click is INSIDE world boundaries.');
        const gx = Math.floor(worldX / GRID_SIZE);
        const gy = Math.floor(worldY / GRID_SIZE);
        const clickedX = gx * GRID_SIZE;
        const clickedY = gy * GRID_SIZE;

        selectedPixel = { x: clickedX, y: clickedY };
        const existingPixel = pixels.find(p => p.x === clickedX && p.y === clickedY);
        
        updateSidePanel(existingPixel);
        sidePanel.style.display = 'block';
        debugLog('Action: Showing side panel.');
    } else {
        debugLog('Result: Click is OUTSIDE world boundaries.');
        // Hide panel if clicked outside the world
        sidePanel.style.display = 'none';
        selectedPixel = null;
        debugLog('Action: Hiding side panel (outside world).');
    }
};

function updateSidePanel(pixel) {
    const gx = selectedPixel.x / GRID_SIZE;
    const gy = selectedPixel.y / GRID_SIZE;
    areaIdText.innerText = `Area #${gx}-${gy}`;

    if (pixel) { // Pixel is owned
        pixelInfo.style.display = 'block';
        purchaseForm.style.display = 'none';
        statusTag.textContent = '소유자 있음';
        statusTag.style.background = '#ff4d4d';
        ownerNickname.textContent = pixel.owner_nickname;
        idolGroup.textContent = pixel.idol_group_name;
    } else { // Pixel is available
        pixelInfo.style.display = 'none';
        purchaseForm.style.display = 'block';
        statusTag.textContent = '구독 가능';
        statusTag.style.background = '#00d4ff';
    }
}

subscribeButton.onclick = () => {
    const nickname = nicknameInput.value.trim();
    const idolGroupName = idolSelect.value;

    if (!nickname) {
        alert('닉네임을 입력해주세요.');
        return;
    }
    if (!selectedPixel) {
        alert('선택된 픽셀이 없습니다.');
        return;
    }

    const groupInfo = idolInfo[idolGroupName];

    socket.emit('new_pixel', {
        x: selectedPixel.x,
        y: selectedPixel.y,
        color: groupInfo.color,
        idol_group_name: idolGroupName,
        owner_nickname: nickname
    });

    sidePanel.style.display = 'none';
    nicknameInput.value = '';
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
