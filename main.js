const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
// Side Panel Elements
const sidePanel = document.getElementById('side-panel');
const areaIdText = document.getElementById('area-id');
const pixelInfo = document.getElementById('pixel-info');
const statusTag = document.getElementById('status-tag');
const selectedPixelCountDiv = document.getElementById('selected-pixel-count'); 
console.log('selectedPixelCountDiv element:', selectedPixelCountDiv); // DEBUG
const ownerNickname = document.getElementById('owner-nickname');
const idolGroup = document.getElementById('idol-group');
const purchaseForm = document.getElementById('purchase-form');
const nicknameInput = document.getElementById('nickname-input');
const idolSelect = document.getElementById('idol-select');
const subscribeButton = document.getElementById('subscribe-button');

// Help Feature Elements
const helpBtn = document.getElementById('help-btn');
const helpModal = document.getElementById('help-modal');
const closeHelpBtn = document.getElementById('close-help');

// Function to toggle help modal
function toggleHelpModal(show) {
    if (helpModal) {
        helpModal.style.display = show ? 'flex' : 'none';
    }
}

// Event Listeners for Help Feature
if (helpBtn) {
    helpBtn.addEventListener('click', () => toggleHelpModal(true));
}
if (closeHelpBtn) {
    closeHelpBtn.addEventListener('click', () => toggleHelpModal(false));
}
if (helpModal) {
    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            toggleHelpModal(false);
        }
    });
}


// NEW: Elements for Owner Stats (Created dynamically if not present, or added here)
let ownerStatsDiv = document.getElementById('owner-stats');
if (!ownerStatsDiv) {
    ownerStatsDiv = document.createElement('div');
    ownerStatsDiv.id = 'owner-stats';
    ownerStatsDiv.style.cssText = "display:flex; justify-content: space-between; margin-top: 5px; color: #00d4ff; font-weight: bold;";
    // Insert it after the idol group info
    const infoContainer = idolGroup.parentElement.parentElement;
    infoContainer.appendChild(ownerStatsDiv);
}

const socket = io();

// Updated to 10M pixels (63240x63240)
const WORLD_SIZE = 63240;
const GRID_SIZE = 20;
const MAX_GRID_START_COORD = Math.floor((WORLD_SIZE - 1) / GRID_SIZE) * GRID_SIZE;
const EPSILON = 0.001; 
let scale = 0.2;
let offsetX = 0;
let offsetY = 0;

// Refactored: Fit to screen logic
function fitToScreen() {
    const scaleX = window.innerWidth / WORLD_SIZE;
    const scaleY = window.innerHeight / WORLD_SIZE;
    scale = Math.min(scaleX, scaleY) * 0.9; // Scale down to 90% for padding
    
    // Center the world
    offsetX = (window.innerWidth - WORLD_SIZE * scale) / 2;
    offsetY = (window.innerHeight - WORLD_SIZE * scale) / 2;
}

// Initial view: Fit to screen
fitToScreen();

// OPTIMIZATION: Use Map for O(1) lookup
// Key: "x,y", Value: Pixel Object
let pixelMap = new Map();

// NEW: Cache for User Pixel Counts
// Key: nickname, Value: count
let userPixelCounts = new Map();

// NEW: Clusters for Group Labels
let clusters = [];

let selectedPixels = []; 
let isDraggingCanvas = false; 
let isSelectingPixels = false; 
let selectionStartX = 0;
let selectionStartY = 0;
let selectionEndX = 0;
let selectionEndY = 0;

// NEW: Auto-Scroll Variables
let currentMouseX = 0;
let currentMouseY = 0;
let autoPanAnimationFrameId = null;

// --- Idol Group Info ---
const idolInfo = {
    // --- Gen 3 & Global Legends ---
    'BTS': { color: 'rgba(123, 63, 242, 0.9)', initials: 'BTS' }, // Purple
    'Blackpink': { color: 'rgba(255, 105, 180, 0.9)', initials: 'BP' }, // Pink
    'TWICE': { color: 'rgba(255, 95, 162, 0.9)', initials: 'TW' }, // Apricot & Neon Magenta
    'EXO': { color: 'rgba(192, 192, 192, 0.9)', initials: 'EXO' }, // Cosmic Latte / Silver
    'Seventeen': { color: 'rgba(247, 202, 201, 0.9)', initials: 'SVT' }, // Rose Quartz & Serenity (Rose)
    'NCT': { color: 'rgba(178, 224, 47, 0.9)', initials: 'NCT' }, // Pearl Neo Champagne
    'Red Velvet': { color: 'rgba(255, 160, 122, 0.9)', initials: 'RV' }, // Pastel Coral
    'Mamamoo': { color: 'rgba(0, 166, 81, 0.9)', initials: 'MMM' }, // Green/Radish
    'GOT7': { color: 'rgba(0, 184, 0, 0.9)', initials: 'GOT7' }, // Green
    'Monsta X': { color: 'rgba(112, 0, 31, 0.9)', initials: 'MX' }, // Dark Red/Purple
    'Stray Kids': { color: 'rgba(220, 20, 60, 0.9)', initials: 'SKZ' }, // Red/Black
    'ITZY': { color: 'rgba(255, 0, 127, 0.9)', initials: 'ITZY' }, // Neon
    'TXT': { color: 'rgba(135, 206, 235, 0.9)', initials: 'TXT' }, // Sky Blue
    'ATEEZ': { color: 'rgba(255, 165, 0, 0.9)', initials: 'ATZ' }, // Orange/Black
    '(G)I-DLE': { color: 'rgba(227, 0, 34, 0.9)', initials: 'IDLE' }, // Neon Red
    'Dreamcatcher': { color: 'rgba(255, 0, 0, 0.9)', initials: 'DC' },
    'LOONA': { color: 'rgba(255, 215, 0, 0.9)', initials: 'LOONA' }, // Moon/Yellow
    'ASTRO': { color: 'rgba(129, 29, 222, 0.9)', initials: 'AST' }, // Vivid Plum
    'The Boyz': { color: 'rgba(255, 0, 0, 0.9)', initials: 'TBZ' },
    'OH MY GIRL': { color: 'rgba(244, 200, 232, 0.9)', initials: 'OMG' },
    'WJSN': { color: 'rgba(255, 182, 193, 0.9)', initials: 'WJSN' },
    
    // --- Gen 4 & Rookies ---
    'NewJeans': { color: 'rgba(46, 128, 255, 0.9)', initials: 'NJ' }, // Jeans Blue
    'aespa': { color: 'rgba(174, 166, 255, 0.9)', initials: 'ae' }, // Aurora / Purple
    'ENHYPEN': { color: 'rgba(80, 80, 80, 0.9)', initials: 'EN-' }, // Dark
    'IVE': { color: 'rgba(255, 0, 85, 0.9)', initials: 'IVE' }, // Red (Love Dive)
    'LE SSERAFIM': { color: 'rgba(20, 20, 20, 0.9)', initials: 'LESS' }, // Fearless Blue/Black
    'NMIXX': { color: 'rgba(135, 206, 250, 0.9)', initials: 'NMIXX' },
    'Kep1er': { color: 'rgba(216, 191, 216, 0.9)', initials: 'Kep1er' }, // Lavender
    'STAYC': { color: 'rgba(255, 105, 180, 0.9)', initials: 'STAYC' }, // Poppy
    'TREASURE': { color: 'rgba(135, 206, 250, 0.9)', initials: 'TRSR' }, // Sky Blue
    'ZEROBASEONE': { color: 'rgba(0, 123, 255, 0.9)', initials: 'ZB1' }, // Blue
    'RIIZE': { color: 'rgba(255, 140, 0, 0.9)', initials: 'RIIZE' }, // Orange
    'TWS': { color: 'rgba(173, 216, 230, 0.9)', initials: 'TWS' }, // Sparkling Blue
    'BOYNEXTDOOR': { color: 'rgba(0, 0, 139, 0.9)', initials: 'BND' }, // Blue
    'BABYMONSTER': { color: 'rgba(220, 20, 60, 0.9)', initials: 'BM' }, // Red
    'ILLIT': { color: 'rgba(255, 192, 203, 0.9)', initials: 'ILLIT' }, // Pink
    'KISS OF LIFE': { color: 'rgba(255, 0, 0, 0.9)', initials: 'KIOF' }, // Red
    'tripleS': { color: 'rgba(0, 0, 0, 0.9)', initials: 'SSS' }, // Black/White
    'PLAVE': { color: 'rgba(100, 149, 237, 0.9)', initials: 'PLAVE' }, // Blue
    'QWER': { color: 'rgba(255, 105, 180, 0.9)', initials: 'QWER' }, // Pink
    'LUCY': { color: 'rgba(0, 0, 255, 0.9)', initials: 'LUCY' }, // Blue
    'DAY6': { color: 'rgba(0, 128, 0, 0.9)', initials: 'DAY6' }, // Green
    'CRAVITY': { color: 'rgba(0, 0, 0, 0.9)', initials: 'ABC' },
    'ONEUS': { color: 'rgba(255, 255, 255, 0.9)', initials: 'ONE' },
    'P1Harmony': { color: 'rgba(255, 0, 0, 0.9)', initials: 'P1H' },
    'I.O.I': { color: 'rgba(255, 192, 203, 0.9)', initials: 'IOI' },
    'Wanna One': { color: 'rgba(0, 206, 209, 0.9)', initials: 'W1' },
    'IZ*ONE': { color: 'rgba(255, 105, 180, 0.9)', initials: 'IZ' },
    'X1': { color: 'rgba(0, 128, 128, 0.9)', initials: 'X1' },

    // --- Gen 2 Legends ---
    'BIGBANG': { color: 'rgba(255, 215, 0, 0.9)', initials: 'BB' }, // Yellow (Crown)
    'Girls\' Generation': { color: 'rgba(255, 105, 180, 0.9)', initials: 'SNSD' }, // Pastel Rose Pink
    'SHINee': { color: 'rgba(121, 230, 242, 0.9)', initials: 'SHN' }, // Pearl Aqua
    'Super Junior': { color: 'rgba(0, 0, 180, 0.9)', initials: 'SJ' }, // Pearl Sapphire Blue
    '2PM': { color: 'rgba(64, 64, 64, 0.9)', initials: '2PM' }, // Metallic Grey
    'TVXQ!': { color: 'rgba(178, 0, 0, 0.9)', initials: 'TVXQ' }, // Pearl Red
    '2NE1': { color: 'rgba(255, 20, 147, 0.9)', initials: '2NE1' }, // Hot Pink
    'Apink': { color: 'rgba(255, 192, 203, 0.9)', initials: 'APK' }, // Strawberry Pink
    'SISTAR': { color: 'rgba(238, 130, 238, 0.9)', initials: 'SISTAR' }, // Fuchsia
    'Miss A': { color: 'rgba(255, 215, 0, 0.9)', initials: 'miss A' },
    'Girl\'s Day': { color: 'rgba(255, 0, 0, 0.9)', initials: 'GsD' },
    'AOA': { color: 'rgba(218, 165, 32, 0.9)', initials: 'AOA' }, // Gold
    'EXID': { color: 'rgba(138, 43, 226, 0.9)', initials: 'EXID' }, // Purple
    'BTOB': { color: 'rgba(66, 206, 244, 0.9)', initials: 'BTOB' }, // Slow Blue
    'HIGHLIGHT': { color: 'rgba(169, 169, 169, 0.9)', initials: 'HL' }, // Dark Grey
    'INFINITE': { color: 'rgba(184, 134, 11, 0.9)', initials: 'INF' }, // Pearl Metal Gold
    'VIXX': { color: 'rgba(0, 0, 128, 0.9)', initials: 'VIXX' }, // Navy / Shining Gold
    'B1A4': { color: 'rgba(173, 255, 47, 0.9)', initials: 'B1A4' }, // Pastel Apple Lime
    'Block B': { color: 'rgba(0, 0, 0, 0.9)', initials: 'BLK' }, // Black/Yellow stripes
    'WINNER': { color: 'rgba(0, 0, 255, 0.9)', initials: 'WIN' }, // Nebula Blue
    'iKON': { color: 'rgba(178, 34, 34, 0.9)', initials: 'iKON' }, // Fire Red
    'KARA': { color: 'rgba(255, 160, 122, 0.9)', initials: 'KARA' }, // Pearl Peach
    'T-ara': { color: 'rgba(255, 255, 0, 0.9)', initials: 'T-ARA' }, // Pearl Ivory
    '4Minute': { color: 'rgba(148, 0, 211, 0.9)', initials: '4M' }, // Pearl Purple
    'Wonder Girls': { color: 'rgba(189, 22, 44, 0.9)', initials: 'WG' }, // Pearl Burgundy
    'f(x)': { color: 'rgba(128, 128, 255, 0.9)', initials: 'f(x)' }, // Periwinkle
};

// --- Clustering Logic ---
function recalculateClusters() {
    clusters = [];
    const pixelsByGroup = new Map();

    // Group pixels by idol group
    pixelMap.forEach(pixel => {
        if (!pixelsByGroup.has(pixel.idol_group_name)) {
            pixelsByGroup.set(pixel.idol_group_name, []);
        }
        pixelsByGroup.get(pixel.idol_group_name).push(pixel);
    });

    // Find connected components for each group
    pixelsByGroup.forEach((pixels, groupName) => {
        const visited = new Set();
        const pixelSet = new Set(pixels.map(p => `${p.x},${p.y}`));

        pixels.forEach(pixel => {
            const key = `${pixel.x},${pixel.y}`;
            if (visited.has(key)) return;

            // Start BFS
            const queue = [pixel];
            visited.add(key);
            const component = [];
            
            let minX = pixel.x, maxX = pixel.x;
            let minY = pixel.y, maxY = pixel.y;

            while (queue.length > 0) {
                const current = queue.shift();
                component.push(current);

                minX = Math.min(minX, current.x);
                maxX = Math.max(maxX, current.x);
                minY = Math.min(minY, current.y);
                maxY = Math.max(maxY, current.y);

                // Check neighbors (Up, Down, Left, Right)
                const neighbors = [
                    { x: current.x + GRID_SIZE, y: current.y },
                    { x: current.x - GRID_SIZE, y: current.y },
                    { x: current.x, y: current.y + GRID_SIZE },
                    { x: current.x, y: current.y - GRID_SIZE }
                ];

                neighbors.forEach(n => {
                    const nKey = `${n.x},${n.y}`;
                    if (pixelSet.has(nKey) && !visited.has(nKey)) {
                        visited.add(nKey);
                        // We need to get the actual pixel object to continue BFS correctly? 
                        // Actually, we just need coordinates for adjacency, but for correctness and data integrity, let's fetch from pixelMap if needed.
                        // However, pixelSet only confirms existence.
                        // Optimization: Just push {x, y} to queue is enough for traversal as long as we know it exists.
                        queue.push({ x: n.x, y: n.y });
                    }
                });
            }

            clusters.push({
                name: groupName,
                minX: minX,
                minY: minY,
                maxX: maxX + GRID_SIZE, // +GRID_SIZE to cover the full cell width
                maxY: maxY + GRID_SIZE,
                centerX: (minX + maxX + GRID_SIZE) / 2,
                centerY: (minY + maxY + GRID_SIZE) / 2,
                width: (maxX + GRID_SIZE) - minX,
                height: (maxY + GRID_SIZE) - minY,
                size: component.length
            });
        });
    });
}


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

    // Apply a clipping path
    ctx.beginPath();
    ctx.rect(0, 0, WORLD_SIZE, WORLD_SIZE);
    ctx.clip(); 

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

    // Draw all owned pixels (Iterate Map values)
    pixelMap.forEach(pixel => {
        const groupInfo = idolInfo[pixel.idol_group_name] || { color: pixel.color, initials: '?' };
        ctx.fillStyle = groupInfo.color;
        ctx.fillRect(pixel.x, pixel.y, GRID_SIZE, GRID_SIZE);
        
        // Removed: Old initials drawing. We are using new clusters now.
    });

    // --- NEW: Draw Group Labels ---
    clusters.forEach(cluster => {
        // Calculate screen size
        // Start with a base font size relative to the smaller dimension
        let worldFontSize = Math.min(cluster.width, cluster.height) * 0.4;
        
        // Refinement: Stricter width constraint (0.75) to absolutely prevent overlap
        ctx.font = `bold ${worldFontSize}px "Pretendard", sans-serif`;
        const textMetrics = ctx.measureText(cluster.name);
        const maxWidth = cluster.width * 0.75; // More padding
        
        if (textMetrics.width > maxWidth) {
             const ratio = maxWidth / textMetrics.width;
             worldFontSize *= ratio;
        }

        const screenFontSize = worldFontSize * scale;

        // Only draw if readable (e.g., > 10px height)
        if (screenFontSize > 10) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = `bold ${worldFontSize}px "Pretendard", sans-serif`; 
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Add shadow/outline for readability
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 4;
            ctx.lineWidth = worldFontSize * 0.05;
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.strokeText(cluster.name, cluster.centerX, cluster.centerY);
            ctx.fillText(cluster.name, cluster.centerX, cluster.centerY);
            
            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        }
    });


    // Draw selection rectangle if currently selecting
    if (isSelectingPixels && (selectionStartX !== selectionEndX || selectionStartY !== selectionEndY)) {
        ctx.strokeStyle = 'lime';
        ctx.lineWidth = 2 / scale;

        const startX = Math.min(selectionStartX, selectionEndX);
        const startY = Math.min(selectionStartY, selectionEndY);
        
        const rawEndX = Math.max(selectionStartX, selectionEndX) + GRID_SIZE;
        const rawEndY = Math.max(selectionStartY, selectionEndY) + GRID_SIZE;

        const clampedEndX = Math.min(WORLD_SIZE, rawEndX);
        const clampedEndY = Math.min(WORLD_SIZE, rawEndY);

        const width = clampedEndX - startX;
        const height = clampedEndY - startY;

        const halfStroke = ctx.lineWidth / 2;

        const drawX = startX + halfStroke;
        const drawY = startY + halfStroke;
        const drawWidthAdjusted = width - ctx.lineWidth;
        const drawHeightAdjusted = height - ctx.lineWidth;

        // Only draw if the adjusted dimensions are positive
        if (drawWidthAdjusted > 0 && drawHeightAdjusted > 0) {
            ctx.strokeRect(drawX, drawY, drawWidthAdjusted, drawHeightAdjusted);
            ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
            ctx.fillRect(drawX, drawY, drawWidthAdjusted, drawHeightAdjusted);
        }
    }
    // Draw visual indicator for selected pixels (after selection is finalized)
    if (selectedPixels.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        selectedPixels.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x + GRID_SIZE);
            maxY = Math.max(maxY, p.y + GRID_SIZE);
        });

        // Draw the bounding box
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 2; 
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        ctx.fillStyle = 'rgba(255, 255, 0, 0.1)'; 
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
        // Convert array to Map and Populate User Pixel Counts
        initialPixels.forEach(p => {
            pixelMap.set(`${p.x},${p.y}`, p);
            
            // Stats
            const count = userPixelCounts.get(p.owner_nickname) || 0;
            userPixelCounts.set(p.owner_nickname, count + 1);
        });
        recalculateClusters(); // Calculate clusters initially
        draw();
    })
    .catch(e => console.error('Error fetching initial pixels:', e));

socket.on('pixel_update', (pixel) => {
    // Check old owner to decrement count
    const key = `${pixel.x},${pixel.y}`;
    const oldPixel = pixelMap.get(key);
    
    if (oldPixel && oldPixel.owner_nickname) {
        const oldOwner = oldPixel.owner_nickname;
        const oldCount = userPixelCounts.get(oldOwner) || 0;
        if (oldCount > 0) {
            userPixelCounts.set(oldOwner, oldCount - 1);
        }
    }

    // Update Map
    pixelMap.set(key, pixel);

    // Increment new owner count
    const newOwner = pixel.owner_nickname;
    const newCount = userPixelCounts.get(newOwner) || 0;
    userPixelCounts.set(newOwner, newCount + 1);

    // DEFER RECALCULATION? No, for single update it's fine.
    recalculateClusters(); 
    draw();
    
    // Update panel if specific pixel is selected
    if (selectedPixels.length === 1 && selectedPixels[0].x === pixel.x && selectedPixels[0].y === pixel.y) {
       updateSidePanel(pixel);
    }
});

// NEW: Batch Update Listener
socket.on('batch_pixel_update', (pixels) => {
    console.log(`Received batch update for ${pixels.length} pixels`);
    let shouldRecalculate = false;

    pixels.forEach(pixel => {
        const key = `${pixel.x},${pixel.y}`;
        const oldPixel = pixelMap.get(key);
        
        if (oldPixel && oldPixel.owner_nickname) {
            const oldOwner = oldPixel.owner_nickname;
            const oldCount = userPixelCounts.get(oldOwner) || 0;
            if (oldCount > 0) {
                userPixelCounts.set(oldOwner, oldCount - 1);
            }
        }

        pixelMap.set(key, pixel);

        const newOwner = pixel.owner_nickname;
        const newCount = userPixelCounts.get(newOwner) || 0;
        userPixelCounts.set(newOwner, newCount + 1);
        shouldRecalculate = true;
    });

    if (shouldRecalculate) {
        recalculateClusters();
        draw();
    }
});


// --- User Interactions (Dragging and Selecting) ---

let lastMouseX, lastMouseY;

// Helper: Calculate selection end and redraw
function updateSelection(clientX, clientY) {
    const canvasRect = canvas.getBoundingClientRect();
    const relativeX = Math.max(0, Math.min(clientX - canvasRect.left, canvas.width));
    const relativeY = Math.max(0, Math.min(clientY - canvasRect.top, canvas.height));

    let worldX = (relativeX - offsetX) / scale;
    let worldY = (relativeY - offsetY) / scale;

    worldX = Math.max(0, Math.min(worldX, WORLD_SIZE));
    worldY = Math.max(0, Math.min(worldY, WORLD_SIZE));

    worldX = Math.floor(worldX);
    worldY = Math.floor(worldY);
    
    selectionEndX = Math.floor(worldX / GRID_SIZE) * GRID_SIZE;
    selectionEndY = Math.floor(worldY / GRID_SIZE) * GRID_SIZE;

    selectionEndX = Math.max(0, Math.min(selectionEndX, MAX_GRID_START_COORD));
    selectionEndY = Math.max(0, Math.min(selectionEndY, MAX_GRID_START_COORD));
    
    draw();
}

// NEW: Auto-Pan Loop
function autoPanLoop() {
    if (!isSelectingPixels) return;

    const threshold = 50; // pixels from edge
    const speed = 10; // Pan speed factor (adjust as needed)

    let panX = 0;
    let panY = 0;

    if (currentMouseX < threshold) panX = speed;
    if (currentMouseX > canvas.width - threshold) panX = -speed;
    if (currentMouseY < threshold) panY = speed;
    if (currentMouseY > canvas.height - threshold) panY = -speed;

    if (panX !== 0 || panY !== 0) {
        offsetX += panX;
        offsetY += panY;
        
        // Optional: Clamp offset so we don't pan too far away from the world
        // But for now, let's keep it simple and free.

        // Update selection end based on NEW offset
        updateSelection(currentMouseX + canvas.getBoundingClientRect().left, currentMouseY + canvas.getBoundingClientRect().top);
    }

    autoPanAnimationFrameId = requestAnimationFrame(autoPanLoop);
}


canvas.onmousedown = (e) => {
    const canvasRect = canvas.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    const relativeX = Math.max(0, Math.min(clientX - canvasRect.left, canvas.width));
    const relativeY = Math.max(0, Math.min(clientY - canvasRect.top, canvas.height));

    let worldX = (relativeX - offsetX) / scale;
    let worldY = (relativeY - offsetY) / scale;

    worldX = Math.max(0, Math.min(worldX, WORLD_SIZE));
    worldY = Math.max(0, Math.min(worldY, WORLD_SIZE));
    
    worldX = Math.floor(worldX);
    worldY = Math.floor(worldY);

    if (e.ctrlKey) {
        isDraggingCanvas = true;
        isSelectingPixels = false; 
    } else { 
        isSelectingPixels = true;
        isDraggingCanvas = false; 
        
        selectionStartX = Math.floor(worldX / GRID_SIZE) * GRID_SIZE;
        selectionStartY = Math.floor(worldY / GRID_SIZE) * GRID_SIZE;

        selectionStartX = Math.max(0, Math.min(selectionStartX, MAX_GRID_START_COORD));
        selectionStartY = Math.max(0, Math.min(selectionStartY, MAX_GRID_START_COORD));

        selectionStartX = Math.max(0, Math.min(selectionStartX, MAX_GRID_START_COORD));
        selectionStartY = Math.max(0, Math.min(selectionStartY, MAX_GRID_START_COORD));
        selectionEndX = selectionStartX; 
        selectionEndY = selectionStartY;
        selectedPixels = []; 
        sidePanel.style.display = 'none'; 
        
        // Start Auto Pan Loop
        cancelAnimationFrame(autoPanAnimationFrameId);
        autoPanLoop();
    }
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
};

window.onmousemove = (e) => {
    currentMouseX = e.clientX;
    currentMouseY = e.clientY;

    if (isDraggingCanvas) {
        offsetX += e.clientX - lastMouseX;
        offsetY += e.clientY - lastMouseY;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        draw();
    } else if (isSelectingPixels) {
        // Just update tracking variables and call updateSelection for immediate feedback used to be here
        // But now we update selection here AND in autoPanLoop.
        updateSelection(e.clientX, e.clientY);
    }
};

window.onmouseup = (e) => {

    // Stop Auto Pan Loop
    if (isSelectingPixels) {
        cancelAnimationFrame(autoPanAnimationFrameId);
    }

    if (isDraggingCanvas) { 
        isDraggingCanvas = false;
        if (selectedPixels.length === 0) {
            sidePanel.style.display = 'none';
        }
        return; 
    }

    if (sidePanel.contains(e.target)) {
        return;
    }

    if (isSelectingPixels) { // Finished selecting
        isSelectingPixels = false;
        
        
        const canvasRect = canvas.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;

        const relativeX = Math.max(0, Math.min(clientX - canvasRect.left, canvas.width));
        const relativeY = Math.max(0, Math.min(clientY - canvasRect.top, canvas.height));

        let currentMouseWorldX = (relativeX - offsetX) / scale;
        let currentMouseWorldY = (relativeY - offsetY) / scale;

        currentMouseWorldX = Math.max(0, Math.min(currentMouseWorldX, WORLD_SIZE));
        currentMouseWorldY = Math.max(0, Math.min(currentMouseWorldY, WORLD_SIZE));

        currentMouseWorldX = Math.floor(currentMouseWorldX);
        currentMouseWorldY = Math.floor(currentMouseWorldY);

        let mouseUpPixelStartX = Math.floor(currentMouseWorldX / GRID_SIZE) * GRID_SIZE;
        let mouseUpPixelStartY = Math.floor(currentMouseWorldY / GRID_SIZE) * GRID_SIZE;

        mouseUpPixelStartX = Math.max(0, Math.min(mouseUpPixelStartX, MAX_GRID_START_COORD));
        mouseUpPixelStartY = Math.max(0, Math.min(mouseUpPixelStartY, MAX_GRID_START_COORD));

        const normalizedStartX = Math.min(selectionStartX, mouseUpPixelStartX);
        const normalizedStartY = Math.min(selectionStartY, mouseUpPixelStartY);
        
        const normalizedEndX = Math.max(selectionStartX, mouseUpPixelStartX);
        const normalizedEndY = Math.max(selectionStartY, mouseUpPixelStartY);

        const selectionBoxX = normalizedStartX;
        const selectionBoxY = normalizedStartY;
        const selectionBoxWidth = (normalizedEndX - normalizedStartX) + GRID_SIZE;
        const selectionBoxHeight = (normalizedEndY - normalizedStartY) + GRID_SIZE;

        // --- Start of User's Provided Intersection Method Logic ---
        // OPTIMIZATION: Calculation happens ONLY here on mouseup

        let rawStartX = Math.floor(selectionBoxX);
        let rawEndX = Math.floor(selectionBoxX + selectionBoxWidth);
        let rawStartY = Math.floor(selectionBoxY);
        let rawEndY = Math.floor(selectionBoxY + selectionBoxHeight);

        const loopStartX = Math.max(0, rawStartX);
        const loopEndX = Math.min(WORLD_SIZE, rawEndX);
        const loopStartY = Math.max(0, rawStartY);
        const loopEndY = Math.min(WORLD_SIZE, rawEndY);

        const validPixels = [];

        // Iterate by GRID_SIZE
        for (let y = loopStartY; y < loopEndY; y += GRID_SIZE) {
            for (let x = loopStartX; x < loopEndX; x += GRID_SIZE) {
                validPixels.push({ x, y });
            }
        }

        selectedPixels = validPixels;

        // --- End of User's Provided Intersection Method Logic ---

        updateSidePanel(); // Update panel based on selectedPixels
        if (selectedPixels.length > 0) {
            sidePanel.style.display = 'block';
        } else {
            sidePanel.style.display = 'none';
        }
        draw(); // Redraw with selected pixels highlighted
        return; // Don't proceed to regular click logic
    }
    
    // Normal Click Handling
    if (e.target === canvas) { 
        const worldX = (e.clientX - offsetX) / scale;
        const worldY = (e.clientY - offsetY) / scale;

        if (worldX >= 0 && worldX < WORLD_SIZE && worldY >= 0 && worldY < WORLD_SIZE) {
            const gx = Math.floor(worldX / GRID_SIZE);
            const gy = Math.floor(worldY / GRID_SIZE);
            const clickedX = gx * GRID_SIZE;
            const clickedY = gy * GRID_SIZE;

            selectedPixels = []; 
            // OPTIMIZATION: O(1) lookup
            const existingPixel = pixelMap.get(`${clickedX},${clickedY}`);
            
            if (existingPixel) { 
                selectedPixels.push(existingPixel); 
                updateSidePanel(existingPixel); 
                sidePanel.style.display = 'block';
            } else { 
                selectedPixels.push({ x: clickedX, y: clickedY });
                updateSidePanel(); 
                sidePanel.style.display = 'block';
            }
            draw();
        } else { 
            sidePanel.style.display = 'none';
            selectedPixels = [];
            draw();
        }
    } else if (!sidePanel.contains(e.target)) { 
        sidePanel.style.display = 'none';
        selectedPixels = [];
        draw();
    }
};


function updateSidePanel(singleOwnedPixel = null) {

    // --- Implement Request 1: Data Filtering for selectedPixels ---
    const validSelectedPixels = selectedPixels.filter(p => 
        p.x >= 0 && p.x < WORLD_SIZE - EPSILON && p.y >= 0 && p.y < WORLD_SIZE - EPSILON
    );
    const totalSelected = validSelectedPixels.length;
    
    pixelInfo.style.display = 'none';
    purchaseForm.style.display = 'none';

    // Hide stats by default
    if(ownerStatsDiv) ownerStatsDiv.style.display = 'none';

    if (totalSelected > 0) {
        selectedPixelCountDiv.textContent = `총 ${totalSelected} 픽셀 선택됨`;
        selectedPixelCountDiv.style.display = 'block';
        
        // OPTIMIZATION: fast check using Map.has() O(1)
        // FIX: Retrieving full pixel objects allows us to display owner info correctly
        const ownedInSelection = validSelectedPixels
            .filter(p => pixelMap.has(`${p.x},${p.y}`))
            .map(p => pixelMap.get(`${p.x},${p.y}`));

        const unownedInSelection = validSelectedPixels.filter(p => !pixelMap.has(`${p.x},${p.y}`));

        if (unownedInSelection.length > 0) { // There are unowned pixels
            purchaseForm.style.display = 'block';
            if (ownedInSelection.length > 0) {
                statusTag.textContent = `${unownedInSelection.length} 픽셀 구매 가능 (${unownedInSelection.length}개 소유됨)`;
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
            
            // Refactored: Display owner info if exactly one owner is found across all selected pixels
            // 1. Get unique owners
            const uniqueOwners = [...new Set(ownedInSelection.map(p => p.owner_nickname))];
            
            if (uniqueOwners.length === 1) {
                const samplePixel = ownedInSelection[0];
                ownerNickname.textContent = samplePixel.owner_nickname;
                idolGroup.textContent = samplePixel.idol_group_name;
                
                // If only one pixel selected, show specific area ID, otherwise show 'Multi-Select'
                if (ownedInSelection.length === 1) {
                    areaIdText.innerText = `Area #${samplePixel.x/GRID_SIZE}-${samplePixel.y/GRID_SIZE}`;
                } else {
                    areaIdText.innerText = `영역 선택됨`;
                }

                // --- NEW: Calculate and Show Owner Stats ---
                const ownerCount = userPixelCounts.get(samplePixel.owner_nickname) || 0;
                // Calculate Market Share (Percentage of TOTAL WORLD)
                // Total grid cells = (WORLD_SIZE / GRID_SIZE) ^ 2
                const totalWorldPixels = Math.pow(Math.floor(WORLD_SIZE / GRID_SIZE), 2);
                const marketShare = ((ownerCount / totalWorldPixels) * 100).toFixed(4); // Show 4 decimal places for precision
                
                if (ownerStatsDiv) {
                    ownerStatsDiv.innerHTML = `<span>보유 정보</span> <span>${ownerCount.toLocaleString()}개 (${marketShare}%)</span>`;
                    ownerStatsDiv.style.display = 'flex';
                }
            } else if (uniqueOwners.length > 1) {
                 // Multiple owners
                 ownerNickname.textContent = '다수의 소유자';
                 idolGroup.textContent = '혼합됨';
                 areaIdText.innerText = `영역 선택됨`;
            }
        }
    } else { // No pixels selected
        sidePanel.style.display = 'none';
        areaIdText.innerText = `Area #??`; 
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

    // FIX: Filter out pixels that are already owned (registered in pixelMap)
    // This prevents purchasing already owned pixels in a mixed selection.
    const pixelsToSend = selectedPixels.filter(p => 
        p.x >= 0 && p.x < WORLD_SIZE - EPSILON && p.y >= 0 && p.y < WORLD_SIZE - EPSILON &&
        !pixelMap.has(`${p.x},${p.y}`)
    );

    if (pixelsToSend.length === 0) {
        alert('구매 가능한 픽셀이 없습니다. (모두 소유됨 혹은 범위 밖)');
        return;
    }

    const pixelsPayload = [];
    const groupInfo = idolInfo[idolGroupName];

    // Generate color dynamically if not in idolInfo
    let color = '';
    if (idolInfo[idolGroupName]) {
        color = idolInfo[idolGroupName].color;
    } else {
        // Generate pastel color based on name hash
        let hash = 0;
        for (let i = 0; i < idolGroupName.length; i++) {
            hash = idolGroupName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = Math.abs(hash) % 360;
        color = `hsla(${h}, 70%, 60%, 0.7)`;
    }

    pixelsToSend.forEach(pixel => {
        pixelsPayload.push({
            x: pixel.x,
            y: pixel.y,
            color: color,
            idol_group_name: idolGroupName,
            owner_nickname: nickname
        });
    });

    // Use Batch Emit with Chunking (Socket.io limit is usually 1MB)
    const CHUNK_SIZE = 2000;
    const totalChunks = Math.ceil(pixelsPayload.length / CHUNK_SIZE);
    console.log(`[CLIENT] Split ${pixelsPayload.length} pixels into ${totalChunks} chunks.`);

    for (let i = 0; i < pixelsPayload.length; i += CHUNK_SIZE) {
        const chunk = pixelsPayload.slice(i, i + CHUNK_SIZE);
        socket.emit('batch_new_pixels', chunk);
        if (i % (CHUNK_SIZE * 10) === 0) {
             console.log(`[CLIENT] Sent chunk ${(i / CHUNK_SIZE) + 1}/${totalChunks}`);
        }
    }
    console.log(`[CLIENT] All chunks sent.`);

    sidePanel.style.display = 'none';
    nicknameInput.value = '';
    selectedPixels = []; 
    draw(); 
};

canvas.onwheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const mouseX = e.clientX - offsetX;
    const mouseY = e.clientY - offsetY;
    
    offsetX -= (mouseX * delta - mouseX);
    offsetY -= (mouseY * delta - mouseY);
    scale *= delta;
    scale = Math.min(Math.max(scale, 0.0005), 20);
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
        fitToScreen();
        draw();
    } else if (e.code === 'F1') {
        e.preventDefault();
        toggleHelpModal(true);
    } else if (e.code === 'Escape') {
        toggleHelpModal(false);
    }
});

window.onresize = draw;
