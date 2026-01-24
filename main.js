const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const selectPanel = document.getElementById('selection-panel');
const coordText = document.getElementById('coord-text');

// 설정
const WORLD_SIZE = 1000; // 1000x1000 픽셀
const GRID_SIZE = 10;   // 10x10 픽셀 단위
let scale = 0.5;
let offsetX = window.innerWidth / 2 - (WORLD_SIZE * scale) / 2;
let offsetY = window.innerHeight / 2 - (WORLD_SIZE * scale) / 2;

function draw() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // 1. 배경 (검정 캔버스)
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

    // 2. 그리드 선 (확대했을 때만 보임)
    if (scale > 2) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        for (let i = 0; i <= WORLD_SIZE; i += GRID_SIZE) {
            ctx.moveTo(i, 0); ctx.lineTo(i, WORLD_SIZE);
            ctx.moveTo(0, i); ctx.lineTo(WORLD_SIZE, i);
        }
        ctx.stroke();
    }

    // 3. 가상의 점유 구역 샘플 (랜덤 로고 느낌)
    ctx.fillStyle = '#7b2cbf'; // 예: 특정 아이돌 컬러
    ctx.fillRect(450, 450, 100, 100); 
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText("SAMPLE", 475, 505);

    ctx.restore();
    updateMinimap();
}

// 마우스 상호작용
let isDragging = false;
let lastMouseX, lastMouseY;

window.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
});

window.addEventListener('mousemove', (e) => {
    if (isDragging) {
        offsetX += e.clientX - lastMouseX;
        offsetY += e.clientY - lastMouseY;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        draw();
    }
});

window.addEventListener('mouseup', (e) => {
    isDragging = false;
    // 구역 선택 로직
    const rect = canvas.getBoundingClientRect();
    const worldX = Math.floor((e.clientX - offsetX) / scale);
    const worldY = Math.floor((e.clientY - offsetY) / scale);

    if (worldX >= 0 && worldX < WORLD_SIZE && worldY >= 0 && worldY < WORLD_SIZE) {
        const gridX = Math.floor(worldX / GRID_SIZE) * GRID_SIZE;
        const gridY = Math.floor(worldY / GRID_SIZE) * GRID_SIZE;
        coordText.innerText = `구역 [${gridX}, ${gridY}]`;
        selectPanel.style.display = 'block';
    } else {
        selectPanel.style.display = 'none';
    }
});

window.addEventListener('wheel', (e) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    scale *= delta;
    // 줌 제한
    scale = Math.min(Math.max(scale, 0.1), 20);
    draw();
});

function updateMinimap() {
    const minimapView = document.getElementById('minimap-view');
    const mmScale = 150 / WORLD_SIZE;
    
    minimapView.style.width = (window.innerWidth / scale * mmScale) + 'px';
    minimapView.style.height = (window.innerHeight / scale * mmScale) + 'px';
    minimapView.style.left = Math.max(0, (-offsetX / scale * mmScale)) + 'px';
    minimapView.style.top = Math.max(0, (-offsetY / scale * mmScale)) + 'px';
}

window.addEventListener('resize', draw);

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        scale = 0.5;
        offsetX = window.innerWidth / 2 - (WORLD_SIZE * scale) / 2;
        offsetY = window.innerHeight / 2 - (WORLD_SIZE * scale) / 2;
        draw();
    }
});

draw();