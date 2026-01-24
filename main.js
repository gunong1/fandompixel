alert("main.js loaded");

const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const sidePanel = document.getElementById('side-panel');
const areaIdText = document.getElementById('area-id');

const socket = io();

// 1000만 픽셀 설정 (약 3162 x 3162)
const WORLD_SIZE = 3162;
const GRID_SIZE = 20; // 구독 단위 블록 크기
let scale = 0.2;
let offsetX = window.innerWidth / 2 - (WORLD_SIZE * scale) / 2;
let offsetY = window.innerHeight / 2 - (WORLD_SIZE * scale) / 2;

let pixels = [];

function draw() {
    console.log('draw function called');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // 배경
    ctx.fillStyle = '#0a0f19';
    ctx.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

    // 그리드 (확대 시)
    if (scale > 1.5) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
        for (let i = 0; i <= WORLD_SIZE; i += GRID_SIZE) {
            ctx.moveTo(i, 0); ctx.lineTo(i, WORLD_SIZE);
            ctx.moveTo(0, i); ctx.lineTo(WORLD_SIZE, i);
        }
        ctx.stroke();
    }

    // Draw all pixels
    pixels.forEach(pixel => {
        ctx.fillStyle = pixel.color;
        ctx.fillRect(pixel.x, pixel.y, GRID_SIZE, GRID_SIZE);
        ctx.strokeStyle = '#00d4ff';
        ctx.strokeRect(pixel.x, pixel.y, GRID_SIZE, GRID_SIZE);
    });

    ctx.restore();
    updateMinimap();
}

// Fetch initial pixels
fetch('/api/pixels')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(initialPixels => {
        console.log('Fetched initial pixels:', initialPixels);
        pixels = initialPixels;
        draw();
    })
    .catch(e => {
        console.error('Error fetching initial pixels:', e);
    });

socket.on('pixel_update', (pixel) => {
    pixels.push(pixel);
    draw();
});


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
    if (isDragging) {
        isDragging = false;
        return;
    }

    const worldX = (e.clientX - offsetX) / scale;
    const worldY = (e.clientY - offsetY) / scale;

    if (worldX >= 0 && worldX < WORLD_SIZE && worldY >= 0 && worldY < WORLD_SIZE) {
        const gx = Math.floor(worldX / GRID_SIZE);
        const gy = Math.floor(worldY / GRID_SIZE);
        areaIdText.innerText = `Area #${gx}-${gy}`;
        sidePanel.style.display = 'block';

        // Simulate buying a pixel
        socket.emit('new_pixel', {
            x: gx * GRID_SIZE,
            y: gy * GRID_SIZE,
            color: 'rgba(255, 0, 0, 0.5)',
            owner: 'New User'
        });

    } else {
        sidePanel.style.display = 'none';
    }
};

canvas.onwheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const mouseX = e.clientX - offsetX;
    const mouseY = e.clientY - offsetY;

    offsetX -= (mouseX * delta - mouseX);
    offsetY -= (mouseY * delta - mouseY);
    scale *= delta;
    scale = Math.min(Math.max(scale, 0.05), 15);
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

