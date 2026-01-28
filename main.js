const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');

// --- Helper: Throttling ---
function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}
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



// --- Notice Feature Logic ---
const noticeBtn = document.getElementById('notice-btn');
const noticeModal = document.getElementById('notice-modal');
const closeNoticeBtn = document.getElementById('close-notice');
const closeNoticeBtnFooter = document.getElementById('close-notice-btn');

function toggleNoticeModal(show) {
    if (noticeModal) {
        noticeModal.style.display = show ? 'flex' : 'none';
    }
}

if (noticeBtn) {
    noticeBtn.addEventListener('click', () => toggleNoticeModal(true));
}
if (closeNoticeBtn) {
    closeNoticeBtn.addEventListener('click', () => toggleNoticeModal(false));
}
if (closeNoticeBtnFooter) {
    closeNoticeBtnFooter.addEventListener('click', () => toggleNoticeModal(false));
}
if (noticeModal) {
    noticeModal.addEventListener('click', (e) => {
        if (e.target === noticeModal) {
            toggleNoticeModal(false);
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

// --- Helper: Dynamic Pricing ---
function getPixelPrice(x, y) {
    const minCenter = 29620; // 31620 - 2000
    const maxCenter = 33620; // 31620 + 2000
    const minMid = 19620;    // 31620 - 12000
    const maxMid = 43620;    // 31620 + 12000

    // High Value Zone (2000 KRW) - Center 4000x4000 area
    if (x >= minCenter && x < maxCenter && y >= minCenter && y < maxCenter) {
        return 2000;
    }
    // Mid Value Zone (1000 KRW) - Surrounding 12000x12000 area
    if (x >= minMid && x < maxMid && y >= minMid && y < maxMid) {
        return 1000;
    }
    // Standard Price (500 KRW)
    return 500;
}
let scale = 0.2;
let offsetX = 0;
let offsetY = 0;
let isDrawing = false; // Throttling flag for draw()
let needsRedraw = true; // Optimization flag

// Refactored: Fit to screen logic
// Refactored: Fit to screen logic

// --- Canvas Resizing Logic ---
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
}

window.addEventListener('resize', () => {
    resizeCanvas();
    fitToScreen(); // Re-center on resize
});

// Initial Resize
resizeCanvas();

function fitToScreen() {
    // Fit to Screen Logic
    const PADDING = 60; // Reduced padding for better visibility
    // No top margin offset needed for centering, typically visuals look better perfectly centered or slightly higher

    const availableWidth = window.innerWidth - PADDING * 2;
    const availableHeight = window.innerHeight - PADDING * 2;

    const scaleX = availableWidth / WORLD_SIZE;
    const scaleY = availableHeight / WORLD_SIZE;
    scale = Math.min(scaleX, scaleY);

    // Center with vertical offset (Move up by 5% of height)
    offsetX = (window.innerWidth - WORLD_SIZE * scale) / 2;
    offsetY = (window.innerHeight - WORLD_SIZE * scale) / 2 - (window.innerHeight * 0.05);

    draw();
}
// Initial view: Fit to screen
// Initial view: Fit to screen call moved to after initialization

// OPTIMIZATION: Use Map for O(1) lookup
// Key: "x,y", Value: Pixel Object
let pixelMap = new Map();

// --- OPTIMIZATION: Spatial Chunking with Offscreen Canvas Caching ---
const CHUNK_SIZE = 1000;
let pixelChunks = new Map(); // Key: "chunkX,chunkY", Value: Set<Pixel>
let chunkImages = new Map(); // Key: "chunkX,chunkY", Value: OffscreenCanvas | HTMLCanvasElement

class ChunkManager {
    constructor(chunkSize) {
        this.chunkSize = chunkSize;
        this.loadedChunks = new Set();
        this.pendingChunks = new Set();
        this.requestQueue = [];
        this.activeRequests = 0;
        this.maxConcurrentRequests = 6; // Limit active requests to prevent ERR_INSUFFICIENT_RESOURCES
    }

    update(minX, minY, maxX, maxY) {
        const startCx = Math.floor(minX / this.chunkSize);
        const endCx = Math.ceil(maxX / this.chunkSize);
        const startCy = Math.floor(minY / this.chunkSize);
        const endCy = Math.ceil(maxY / this.chunkSize);

        for (let cx = startCx; cx <= endCx; cx++) {
            for (let cy = startCy; cy <= endCy; cy++) {
                this.loadChunk(cx, cy);
            }
        }
    }

    loadChunk(cx, cy) {
        const key = `${cx},${cy}`;
        if (this.loadedChunks.has(key) || this.pendingChunks.has(key)) return;

        this.pendingChunks.add(key);
        const minX = cx * this.chunkSize;
        const minY = cy * this.chunkSize;
        const maxX = minX + this.chunkSize;
        const maxY = minY + this.chunkSize;

        if (maxX < 0 || minX > WORLD_SIZE || maxY < 0 || minY > WORLD_SIZE) {
            this.loadedChunks.add(key);
            this.pendingChunks.delete(key);
            return;
        }

        // Add to queue
        this.requestQueue.push({ cx, cy, minX, minY, maxX, maxY, key });
        this.processQueue();
    }

    async processQueue() {
        if (this.activeRequests >= this.maxConcurrentRequests || this.requestQueue.length === 0) return;

        while (this.activeRequests < this.maxConcurrentRequests && this.requestQueue.length > 0) {
            const task = this.requestQueue.shift();
            this.activeRequests++;

            this.fetchChunk(task).finally(() => {
                this.activeRequests--;
                this.processQueue();
            });
        }
    }

    async fetchChunk({ cx, cy, minX, minY, maxX, maxY, key }) {
        try {
            const res = await fetch(`/api/pixels/chunk?minX=${minX}&minY=${minY}&maxX=${maxX}&maxY=${maxY}`);
            if (!res.ok) throw new Error(`Chunk ${key} fetch failed`);
            const pixels = await res.json();
            // console.log(`[Chunk ${key}] Loaded ${pixels.length} pixels`);

            pixels.forEach(p => {
                try {
                    p.x = Number(p.x);
                    p.y = Number(p.y);
                    updatePixelStore(p, false);
                } catch (err) {
                    // console.error("Error processing pixel:", p, err);
                }
            });

            this.loadedChunks.add(key);

            // Render to Offscreen Canvas Cache
            try {
                this.renderChunkToCache(cx, cy);
            } catch (err) {
                console.error("Error rendering chunk to cache:", key, err);
            }

            // Optional: progressive draw
            // draw(); 

        } catch (e) {
            console.error("Chunk load error:", e);
            this.loadedChunks.delete(key); // Retry allowed
        } finally {
            this.pendingChunks.delete(key);
        }
    }

    renderChunkToCache(cx, cy) {
        const key = `${cx},${cy}`;
        if (!pixelChunks.has(key)) return;

        const pixels = pixelChunks.get(key);
        if (pixels.size === 0 && chunkImages.has(key)) {
            chunkImages.delete(key);
            return;
        }

        let offCanvas = chunkImages.get(key);
        if (!offCanvas) {
            // Force standard Canvas for debugging compatibility
            offCanvas = document.createElement('canvas');
            offCanvas.width = this.chunkSize;
            offCanvas.height = this.chunkSize;
            chunkImages.set(key, offCanvas);
        }

        const offCtx = offCanvas.getContext('2d');
        offCtx.clearRect(0, 0, this.chunkSize, this.chunkSize);

        const chunkMinX = cx * this.chunkSize;
        const chunkMinY = cy * this.chunkSize;

        let drawnCount = 0;

        pixels.forEach(p => {
            if (p.x < chunkMinX || p.x >= chunkMinX + this.chunkSize ||
                p.y < chunkMinY || p.y >= chunkMinY + this.chunkSize) {
                return;
            }

            const localX = p.x - chunkMinX;
            const localY = p.y - chunkMinY;

            const groupInfo = idolInfo[p.idol_group_name] || { color: p.color || '#fff' };
            offCtx.fillStyle = groupInfo.color;
            offCtx.fillRect(localX, localY, GRID_SIZE, GRID_SIZE);
            drawnCount++;
        });
        // console.log(`[Chunk ${key}] cached ${drawnCount} pixels`);
    }

    invalidateChunk(cx, cy) {
        this.renderChunkToCache(cx, cy);
    }
}
const chunkManager = new ChunkManager(CHUNK_SIZE); // Ensure global instance uses correct chunk size


function getChunkKey(x, y) {
    const cx = Math.floor(x / CHUNK_SIZE);
    const cy = Math.floor(y / CHUNK_SIZE);
    return `${cx},${cy}`;
}

function addPixelToChunk(pixel) {
    const key = getChunkKey(pixel.x, pixel.y);
    if (!pixelChunks.has(key)) {
        pixelChunks.set(key, new Set());
    }
    pixelChunks.get(key).add(pixel);
}

// ... (User Caches)
let userPixelCounts = new Map();
let userGroupPixelCounts = new Map();
let clusters = [];
let idolPixelCounts = new Map();


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

// NEW: Mobile Touch Handling Variables
let isMobileSelectMode = false;
let lastTouchX = 0;
let lastTouchY = 0;
let lastPinchDistance = 0;

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


// --- Render Loop (Simplified) ---
function gameLoop(timestamp) {
    // Note: Cluster updates are now event-driven (socket), removed from here.

    if (needsRedraw) {
        _render();
        needsRedraw = false;
    }
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// Initial Fit
fitToScreen();

function draw() {
    needsRedraw = true;
}

function _render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = '#0a0f19';
    ctx.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

    // --- Dynamic Pricing Zones (Visual Guide) ---
    // Mid Value Zone (1000 KRW) - Center +/- 12000
    ctx.fillStyle = 'rgba(0, 100, 255, 0.05)';
    ctx.fillRect(19620, 19620, 24000, 24000);

    // High Value Zone (2000 KRW) - Center +/- 2000
    ctx.fillStyle = 'rgba(255, 215, 0, 0.08)';
    ctx.fillRect(29620, 29620, 4000, 4000);

    // Optional: Border for High Value Zone
    if (scale > 0.05) {
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 2 / scale;
        ctx.strokeRect(29620, 29620, 4000, 4000);
    }

    // Calculate Visible Viewport
    const VIEWPORT_MARGIN = 100 / scale;
    const minVisibleX = -offsetX / scale - VIEWPORT_MARGIN;
    const maxVisibleX = (canvas.width - offsetX) / scale + VIEWPORT_MARGIN;
    const minVisibleY = -offsetY / scale - VIEWPORT_MARGIN;
    const maxVisibleY = (canvas.height - offsetY) / scale + VIEWPORT_MARGIN;

    // Trigger Loads
    chunkManager.update(minVisibleX, minVisibleY, maxVisibleX, maxVisibleY);

    // Draw Grid (Limit to viewport, Fade out logic)
    if (scale > 0.05) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1 / scale;
        const startX = Math.max(0, Math.floor(minVisibleX / GRID_SIZE) * GRID_SIZE);
        const startY = Math.max(0, Math.floor(minVisibleY / GRID_SIZE) * GRID_SIZE);
        const endX = Math.min(WORLD_SIZE, Math.ceil(maxVisibleX / GRID_SIZE) * GRID_SIZE);
        const endY = Math.min(WORLD_SIZE, Math.ceil(maxVisibleY / GRID_SIZE) * GRID_SIZE);
        ctx.beginPath();
        for (let x = startX; x <= endX; x += GRID_SIZE) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }
        for (let y = startY; y <= endY; y += GRID_SIZE) {
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }
        ctx.stroke();
    }

    // Draw World Border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 10 / scale;
    ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);

    // --- RENDER PIXELS VIA CACHED CHUNKS ---
    // Instead of iterating pixels, we draw the cached chunk images
    const startChunkX = Math.floor(minVisibleX / CHUNK_SIZE);
    const endChunkX = Math.ceil(maxVisibleX / CHUNK_SIZE);
    const startChunkY = Math.floor(minVisibleY / CHUNK_SIZE);
    const endChunkY = Math.ceil(maxVisibleY / CHUNK_SIZE);

    // Disable image smoothing for crisp pixels
    ctx.imageSmoothingEnabled = false;

    for (let cx = startChunkX; cx <= endChunkX; cx++) {
        for (let cy = startChunkY; cy <= endChunkY; cy++) {
            const key = `${cx},${cy}`;

            // DEBUG: Blue Border for LOADED chunks (Removed)
            /* if (chunkManager.loadedChunks.has(key)) {
               // ...
            } */

            const chunkImg = chunkImages.get(key);

            if (chunkImg) {
                // Determine render position of this chunk
                const drawX = cx * CHUNK_SIZE;
                const drawY = cy * CHUNK_SIZE;

                // Draw the cached image
                ctx.drawImage(chunkImg, drawX, drawY);

                // DEBUG: Draw Chunk Borders (Removed)
                /* ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                   // ...
                */
            }
        }
    }

    // --- RENDER CLUSTER LABELS (LOD) ---
    // Only render text if zoomed in enough (relaxed threshold)
    if (true) { // Always try to render labels
        const useShadows = scale > 0.3; // Stricter shadow threshold for performance
        if (useShadows) {
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 4;
        } else {
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        clusters.forEach(cluster => {
            // Strict Culling for Clusters
            if (cluster.maxX < minVisibleX || cluster.minX > maxVisibleX ||
                cluster.maxY < minVisibleY || cluster.minY > maxVisibleY) return;

            let worldFontSize = Math.min(cluster.width, cluster.height) * 0.8; // Larger text

            ctx.font = `bold ${worldFontSize}px "Pretendard", sans-serif`;
            const textMetrics = ctx.measureText(cluster.name);
            const maxWidth = cluster.width * 0.9;

            if (textMetrics.width > maxWidth) {
                const ratio = maxWidth / textMetrics.width;
                worldFontSize *= ratio;
            }

            const screenFontSize = worldFontSize * scale;
            if (screenFontSize > 1) { // Visible if at least 1px
                // Re-set font if changed (minimized context switching in loop optimal but hard given dynamic sizes)
                ctx.font = `bold ${worldFontSize}px "Pretendard", sans-serif`;

                ctx.lineWidth = worldFontSize * 0.05;
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                ctx.strokeText(cluster.name, cluster.x, cluster.y);
                ctx.fillText(cluster.name, cluster.x, cluster.y);
            }
        });

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }


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
        ctx.lineWidth = 2 / scale; // Thinner line when zoomed out
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
        ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
    }

    ctx.restore();
    updateMinimap();
}

// --- Data Fetching and Socket Events ---


// --- Data Fetching and Socket Events ---

// Helper: Centralize pixel updates
function updatePixelStore(pixel, redraw = true) {
    const key = `${pixel.x},${pixel.y}`;
    const oldPixel = pixelMap.get(key);

    // Handle Ownership Stats
    if (oldPixel && oldPixel.owner_nickname) {
        const oldOwner = oldPixel.owner_nickname;
        const oldCount = userPixelCounts.get(oldOwner) || 0;
        if (oldCount > 0) userPixelCounts.set(oldOwner, oldCount - 1);

        // Update Idol Stats (Decrement)
        if (oldPixel.idol_group_name) {
            const oldGroup = oldPixel.idol_group_name;
            const oldGroupCount = idolPixelCounts.get(oldGroup) || 0;
            if (oldGroupCount > 0) idolPixelCounts.set(oldGroup, oldGroupCount - 1);

            // Update User-Group Stats (Decrement)
            const userGroupKey = `${oldOwner}:${oldGroup}`;
            const oldUserGroupCount = userGroupPixelCounts.get(userGroupKey) || 0;
            if (oldUserGroupCount > 0) userGroupPixelCounts.set(userGroupKey, oldUserGroupCount - 1);
        }

        // Remove from old chunk (though coordinates shouldn't change, logic is safer)
        const oldChunkCoords = getChunkKey(oldPixel.x, oldPixel.y).split(',');
        const oldChunkKey = `${oldChunkCoords[0]},${oldChunkCoords[1]}`;

        if (pixelChunks.has(oldChunkKey)) {
            pixelChunks.get(oldChunkKey).delete(oldPixel);
            if (redraw) chunkManager.invalidateChunk(parseInt(oldChunkCoords[0]), parseInt(oldChunkCoords[1]));
        }
    }

    // Update Map and Chunk
    pixelMap.set(key, pixel);
    addPixelToChunk(pixel);

    // Invalidate New Chunk
    const newChunkKey = getChunkKey(pixel.x, pixel.y);
    const [cx, cy] = newChunkKey.split(',').map(Number);
    if (redraw) {
        chunkManager.invalidateChunk(cx, cy);
    }

    // Request Cluster Update on any change
    requestClusterUpdate();

    // Update New Owner Stats
    if (pixel.owner_nickname) {
        const newOwner = pixel.owner_nickname;
        const newCount = userPixelCounts.get(newOwner) || 0;
        userPixelCounts.set(newOwner, newCount + 1);

        // Update Idol Stats (Increment)
        if (pixel.idol_group_name) {
            const newGroup = pixel.idol_group_name;
            const newGroupCount = idolPixelCounts.get(newGroup) || 0;
            idolPixelCounts.set(newGroup, newGroupCount + 1);

            // Update User-Group Stats (Increment)
            const userGroupKey = `${newOwner}:${newGroup}`;
            const newUserGroupCount = userGroupPixelCounts.get(userGroupKey) || 0;
            userGroupPixelCounts.set(userGroupKey, newUserGroupCount + 1);
            // console.log(`Stats updated for ${userGroupKey}: ${newUserGroupCount + 1}`);
        }
    }
}

// Initial Data Load (Modified for Chunking)
// We NO LONGER fetch all pixels. 
// Pixels will be loaded by auto-pan/render loop or initial draw.

updateRankingBoard();
draw(); // This will trigger _render -> chunkManager.update -> API call

socket.on('pixel_update', (pixel) => {
    updatePixelStore(pixel);

    // Check selection update
    if (selectedPixels.length === 1 && selectedPixels[0].x === pixel.x && selectedPixels[0].y === pixel.y) {
        updateSidePanel(pixel);
    }

    // Simple redraw
    draw();
});

// NEW: Batch Update Listener
socket.on('batch_pixel_update', (pixels) => {
    console.log(`Received batch update for ${pixels.length} pixels`);

    pixels.forEach(pixel => {
        updatePixelStore(pixel);
    });

    recalculateClusters(); // Batch updates might change clusters significantly, so we might want to force it or stick to throttle
    requestClusterUpdate();
    draw();
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

window.onmousemove = throttle((e) => {
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
}, 16); // Throttle to ~60fps

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
            const key = `${clickedX},${clickedY}`;
            const existingPixel = pixelMap.get(key);

            // console.log(`[DEBUG] Clicked: ${key}, Exists: ${!!existingPixel}, Map Size: ${pixelMap.size}`); // Debug Log

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
    if (ownerStatsDiv) ownerStatsDiv.style.display = 'none';

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
                areaIdText.innerText = `총 ${totalSelected} 픽셀 선택됨`;
                statusTag.style.background = '#00d4ff'; // Blue for all unowned
            }

            // Calculate Total Price Dynamically
            const totalPrice = unownedInSelection.reduce((sum, p) => sum + getPixelPrice(p.x, p.y), 0);
            areaIdText.innerText = `총 구독료: ₩ ${totalPrice.toLocaleString()}`;
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
                    areaIdText.innerText = `Area #${samplePixel.x / GRID_SIZE}-${samplePixel.y / GRID_SIZE}`;
                } else {
                    areaIdText.innerText = `영역 선택됨`;
                }

                // --- NEW: Calculate and Show Owner Stats (Specific to Group) ---
                // const ownerCount = userPixelCounts.get(samplePixel.owner_nickname) || 0; // OLD: Global count

                const userGroupKey = `${samplePixel.owner_nickname}:${samplePixel.idol_group_name}`;
                const ownerCount = userGroupPixelCounts.get(userGroupKey) || 0;

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


// --- User Auth ---
let currentUser = null;

async function checkAuth() {
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    const userNickname = document.getElementById('user-nickname');

    try {
        const response = await fetch('/api/me');
        if (response.ok) {
            currentUser = await response.json();
            userNickname.textContent = currentUser.nickname;
            userInfo.style.display = 'flex';
            loginBtn.style.display = 'none';

            // Enable and pre-fill for logged-in users
            if (nicknameInput) {
                nicknameInput.value = currentUser.nickname;
                nicknameInput.disabled = false;
                nicknameInput.readOnly = true;
                nicknameInput.placeholder = '닉네임';
                nicknameInput.style.backgroundColor = '#333';
            }
        } else {
            // Not logged in (401) - Expected for guests
            // silently handle as guest
            currentUser = null;
        }
    } catch (error) {
        // Network error or other issues
        console.debug('Auth check status: User is guest or offline.');
        currentUser = null;
        if (userInfo) userInfo.style.display = 'none';
        if (loginBtn) loginBtn.style.display = 'block';

        // Disable for guests
        if (nicknameInput) {
            nicknameInput.value = '';
            nicknameInput.disabled = true;
            nicknameInput.placeholder = '로그인이 필요합니다';
            nicknameInput.style.backgroundColor = 'rgba(255,255,255,0.05)';
        }
    }
}

checkAuth();

subscribeButton.onclick = async () => {
    let nickname = nicknameInput.value.trim();
    if (currentUser) {
        nickname = currentUser.nickname;
    }

    const idolGroupName = idolSelect.value;

    if (!nickname) {
        alert('닉네임을 입력해주세요 (로그인이 필요할 수 있습니다).');
        return;
    }
    if (selectedPixels.length === 0) {
        alert('선택된 픽셀이 없습니다.');
        return;
    }

    const pixelsToSend = selectedPixels.filter(p =>
        p.x >= 0 && p.x < WORLD_SIZE - EPSILON && p.y >= 0 && p.y < WORLD_SIZE - EPSILON &&
        !pixelMap.has(`${p.x},${p.y}`)
    );

    if (pixelsToSend.length === 0) {
        alert('구매 가능한 픽셀이 없습니다. (모두 소유됨 혹은 범위 밖)');
        return;
    }

    const totalAmount = pixelsToSend.reduce((sum, p) => sum + getPixelPrice(p.x, p.y), 0);
    const paymentId = `payment-${Math.random().toString(36).slice(2, 11)}`;

    try {
        console.log(`[PAYMENT] Requesting payment for ${pixelsToSend.length} pixels (Total: ₩${totalAmount})`);

        // --- PORTONE V2 REQUEST ---
        const response = await PortOne.requestPayment({
            storeId: "store-81d6360b-5e80-4765-b7df-09333509eb04", // Updated from screenshot
            channelKey: "channel-key-c55bfde2-056f-414f-b62c-cf4d2faddfdf",
            paymentId: paymentId,
            orderName: `Idolpixel: ${pixelsToSend.length} pixels`,
            totalAmount: totalAmount,
            currency: "CURRENCY_KRW",
            payMethod: "CARD", // Default to card, user can change in UI if configured
            customer: {
                fullName: nickname,
            },
        });

        if (response.code !== undefined) {
            // Payment Failed
            alert(`결제에 실패했습니다: ${response.message}`);
            return;
        }

        console.log(`[PAYMENT] Success! Payment ID: ${response.paymentId}`);
        // Proceed with database update
        const pixelsPayload = [];

        // Generate color dynamically if not in idolInfo
        let color = '';
        if (idolInfo[idolGroupName]) {
            color = idolInfo[idolGroupName].color;
        } else {
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

        // Use Batch Emit with Chunking
        const CHUNK_SIZE = 2000;
        const totalChunks = Math.ceil(pixelsPayload.length / CHUNK_SIZE);

        for (let i = 0; i < pixelsPayload.length; i += CHUNK_SIZE) {
            const chunk = pixelsPayload.slice(i, i + CHUNK_SIZE);
            socket.emit('batch_new_pixels', chunk);
        }

        alert('구매가 완료되었습니다!');
        sidePanel.style.display = 'none';
        nicknameInput.value = '';
        selectedPixels = [];
        draw();

    } catch (error) {
        console.error('[PAYMENT] Error:', error);
        alert('결제 처리 중 도우미 오류가 발생했습니다.');
    }
};

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const mouseX = e.clientX - offsetX;
    const mouseY = e.clientY - offsetY;

    offsetX -= (mouseX * delta - mouseX);
    offsetY -= (mouseY * delta - mouseY);
    scale *= delta;
    scale = Math.min(Math.max(scale, 0.0005), 20);
    draw();
}, { passive: false });

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


// --- Mobile Controls ---
const mobileModeBtn = document.getElementById('mobile-mode-btn');
if (mobileModeBtn) {
    mobileModeBtn.addEventListener('click', () => {
        isMobileSelectMode = !isMobileSelectMode;
        if (isMobileSelectMode) {
            mobileModeBtn.textContent = '선택';
            mobileModeBtn.style.color = '#ff4d4d'; // Red for select mode
            mobileModeBtn.style.borderColor = '#ff4d4d';
        } else {
            mobileModeBtn.textContent = '이동';
            mobileModeBtn.style.color = '#00d4ff'; // Blue for move mode
            mobileModeBtn.style.borderColor = '#00d4ff';
            // Clear selection if switching back to move mode
            isSelectingPixels = false;
            selectedPixels = [];
            draw();
            sidePanel.style.display = 'none';
        }
    });

    // Prevent default touch actions on the button
    mobileModeBtn.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: false });
}

// --- Touch Event Listeners (Enhanced for Long-Press Selection) ---
let longPressTimer = null;
let isLongPressMode = false;
const LONG_PRESS_DURATION = 250; // ms (0.25s)

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent scrolling
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;

        // Sync mouse coordinates for autoPanLoop
        currentMouseX = touch.clientX;
        currentMouseY = touch.clientY;

        isDraggingCanvas = false;
        isLongPressMode = false;

        // Start Long Press Timer
        longPressTimer = setTimeout(() => {
            isLongPressMode = true;
            if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback

            // Start Selection Logic (Simulate mousedown)
            if (canvas.onmousedown) {
                canvas.onmousedown({
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    target: canvas,
                    ctrlKey: false, // Force select mode
                    preventDefault: () => { }
                });
            }
        }, LONG_PRESS_DURATION);

    } else if (e.touches.length === 2) {
        clearTimeout(longPressTimer); // Cancel long press on 2-finger interaction
        // Start Pinch Zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastPinchDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
    }
}, { passive: false });

canvas.addEventListener('touchmove', throttle((e) => {
    e.preventDefault();

    if (e.touches.length === 1) {
        const touch = e.touches[0];

        // Sync mouse coordinates for autoPanLoop
        currentMouseX = touch.clientX;
        currentMouseY = touch.clientY;

        const deltaX = touch.clientX - lastTouchX;
        const deltaY = touch.clientY - lastTouchY;
        const moveDist = Math.hypot(deltaX, deltaY);

        // If moved significantly before long press triggers, cancel it -> Pan Mode
        if (!isLongPressMode && moveDist > 5) {
            clearTimeout(longPressTimer);
            isDraggingCanvas = true;
        }

        if (isLongPressMode) {
            // Handle Selection Drag
            if (isSelectingPixels) {
                updateSelection(touch.clientX, touch.clientY);
            }
        } else if (isDraggingCanvas) {
            // Handle Pan
            offsetX += deltaX;
            offsetY += deltaY;
            draw();
        }
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
    } else if (e.touches.length === 2) {
        clearTimeout(longPressTimer);
        // Handle Pinch Zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentdist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);

        if (lastPinchDistance > 0) {
            const zoomSpeed = 0.005;
            const deltaZoom = (currentdist - lastPinchDistance) * zoomSpeed;
            const zoomFactor = 1 + deltaZoom;
            const newScale = Math.max(0.01, Math.min(5, scale * zoomFactor));

            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const worldX = (centerX - offsetX) / scale;
            const worldY = (centerY - offsetY) / scale;

            scale = newScale;
            offsetX = centerX - worldX * scale;
            offsetY = centerY - worldY * scale;

            draw();
        }
        lastPinchDistance = currentdist;
    }
}, 16), { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    clearTimeout(longPressTimer); // Always clear timer

    if (e.touches.length < 2) {
        lastPinchDistance = 0;
    }

    if (isLongPressMode) {
        // End Long Press Selection
        if (isSelectingPixels) {
            const touch = e.changedTouches[0];
            window.onmouseup({
                clientX: touch.clientX,
                clientY: touch.clientY,
                target: canvas,
                preventDefault: () => { }
            });
        }
        isLongPressMode = false;
        return;
    }

    if (isDraggingCanvas) {
        isDraggingCanvas = false;
        return;
    }

    // Tap Detection (No drag, No long press)
    if (e.changedTouches.length === 1) {
        const touch = e.changedTouches[0];
        window.onmouseup({
            clientX: touch.clientX,
            clientY: touch.clientY,
            target: canvas,
            preventDefault: () => { }
        });
    }
});




// --- HISTORY / LOG FEATURE ---
const historyBtn = document.getElementById('history-btn');
const historyModal = document.getElementById('history-modal');
const closeHistoryBtn = document.getElementById('close-history-btn');
const historyList = document.getElementById('history-list');

if (historyBtn) {
    historyBtn.onclick = () => {
        historyModal.style.display = 'flex';
        fetchHistory();
    };
}

if (closeHistoryBtn) {
    closeHistoryBtn.onclick = () => {
        historyModal.style.display = 'none';
    };
}

// Close on outside click
window.addEventListener('click', (e) => {
    if (e.target === historyModal) {
        historyModal.style.display = 'none';
    }
});

function fetchHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    historyList.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">로딩 중...</td></tr>';

    fetch('/api/history')
        .then(res => {
            if (res.status === 401) throw new Error('로그인이 필요합니다.');
            if (!res.ok) throw new Error('내역을 불러오는데 실패했습니다.');
            return res.json();
        })
        .then(data => {
            historyList.innerHTML = '';
            if (data.length === 0) {
                historyList.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: #aaa;">구매 내역이 없습니다.</td></tr>';
                return;
            }

            data.forEach(item => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';

                // Format Dates (Simple YYYY-MM-DD HH:MM)
                const dateOpts = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
                const purchased = item.purchased_at ? new Date(item.purchased_at).toLocaleString('ko-KR', dateOpts) : '-';
                const expires = item.expires_at ? new Date(item.expires_at).toLocaleString('ko-KR', dateOpts) : '무제한';

                const isExpired = item.expires_at && new Date(item.expires_at) < new Date();
                const colorStyle = isExpired ? 'color: #ff4d4d;' : '';

                tr.innerHTML = `
                    <td style="padding: 10px; font-size: 13px;">${purchased}</td>
                    <td style="padding: 10px;">
                         <span style="color: ${idolInfo[item.idol_group_name]?.color || '#fff'}; font-weight:bold;">${item.idol_group_name}</span>
                    </td>
                    <td style="padding: 10px; font-weight: bold; color: #00d4ff;">${item.count}개</td>
                    <td style="padding: 10px; font-size: 13px; ${colorStyle}">${expires}</td>
                `;
                historyList.appendChild(tr);
            });
        })
        .catch(err => {
            console.error(err);
            historyList.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 20px; color: #ff6b6b;">${err.message}</td></tr>`;
        });
}

// --- Restored Logic: Stats & Clusters ---

function recalculateStats() {
    console.log("[Stats] Recalculating all stats...");
    userPixelCounts.clear();
    idolPixelCounts.clear();
    userGroupPixelCounts.clear();

    pixelMap.forEach(pixel => {
        if (!pixel.owner_nickname) return;

        const owner = pixel.owner_nickname;
        const group = pixel.idol_group_name;

        // User Count
        userPixelCounts.set(owner, (userPixelCounts.get(owner) || 0) + 1);

        if (group) {
            // Group Count
            idolPixelCounts.set(group, (idolPixelCounts.get(group) || 0) + 1);

            // User-Group Count (Format: owner:group)
            const userGroupKey = `${owner}:${group}`;
            userGroupPixelCounts.set(userGroupKey, (userGroupPixelCounts.get(userGroupKey) || 0) + 1);
        }
    });
    console.log(`[Stats] Recalculation complete. PixelMap size: ${pixelMap.size}, Unique Owners: ${userPixelCounts.size}`);
}

let clusterUpdateTimeout = null;
function requestClusterUpdate() {
    if (clusterUpdateTimeout) clearTimeout(clusterUpdateTimeout);
    clusterUpdateTimeout = setTimeout(() => {
        recalculateClusters();
        draw();
    }, 500); // Debounce 500ms
}

function recalculateClusters() {
    // Simple clustering: Merge adjacent pixels of same group
    // For visualization labels
    clusters = [];
    const visited = new Set();

    pixelMap.forEach(pixel => {
        const key = `${pixel.x},${pixel.y}`;
        if (visited.has(key) || !pixel.idol_group_name) return;

        const groupName = pixel.idol_group_name;
        const clusterPixels = [];
        const queue = [pixel];
        visited.add(key);

        let minX = pixel.x, maxX = pixel.x, minY = pixel.y, maxY = pixel.y;

        while (queue.length > 0) {
            const p = queue.shift();
            clusterPixels.push(p);

            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);

            // Check neighbors (4-connectivity)
            const neighbors = [
                { x: p.x + GRID_SIZE, y: p.y },
                { x: p.x - GRID_SIZE, y: p.y },
                { x: p.x, y: p.y + GRID_SIZE },
                { x: p.x, y: p.y - GRID_SIZE }
            ];

            neighbors.forEach(n => {
                const nKey = `${n.x},${n.y}`;
                if (!visited.has(nKey) && pixelMap.has(nKey)) {
                    const neighborPixel = pixelMap.get(nKey);
                    if (neighborPixel.idol_group_name === groupName) {
                        visited.add(nKey);
                        queue.push(neighborPixel);
                    }
                }
            });
        }

        // Only label significant clusters
        if (clusterPixels.length >= 1) { // Changed from 5 to 1 to show all groups
            clusters.push({
                name: groupName,
                x: (minX + maxX) / 2,
                y: (minY + maxY) / 2,
                count: clusterPixels.length,
                width: maxX - minX + GRID_SIZE,
                height: maxY - minY + GRID_SIZE,
                minX: minX, // Ensure these are saved for culling
                minY: minY,
                maxX: maxX + GRID_SIZE,
                maxY: maxY + GRID_SIZE
            });
        }
    });
    // console.log(`[Clusters] Calculated ${clusters.length} clusters`);
}

// --- NEW: Ranking Board (Server-side) ---
function updateRankingBoard() {
    fetch('/api/ranking')
        .then(res => res.json())
        .then(rankingData => {
            const rankingList = document.getElementById('ranking-list');
            if (!rankingList) return;
            rankingList.innerHTML = '';

            // Calculate total for percentage
            // FIXED: Calculate total world pixels for percentage (Territory Control %)
            const TOTAL_WORLD_CAPACITY = Math.pow(Math.floor(WORLD_SIZE / GRID_SIZE), 2);

            // Show Top 3 Only
            rankingData.slice(0, 3).forEach((item, index) => {
                const li = document.createElement('li');
                const groupInfo = idolInfo[item.name] || { color: '#ccc', initials: '?' };

                // Percentage
                const percentage = TOTAL_WORLD_CAPACITY > 0 ? ((item.count / TOTAL_WORLD_CAPACITY) * 100).toFixed(4) : 0;
                const rankEmoji = ['🥇', '🥈', '🥉'][index] || `<span class="rank-num">${index + 1}</span>`;

                li.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);";
                li.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 16px; width: 20px; text-align: center;">${rankEmoji}</span>
                        <div>
                            <div style="font-weight: bold; color: ${groupInfo.color}; text-shadow: 0 0 5px ${groupInfo.color}40;">${item.name}</div>
                            <div style="font-size: 11px; opacity: 0.7;">${item.count.toLocaleString()} px</div>
                        </div>
                    </div>
                    <div style="font-weight: bold; font-family: monospace; color: #00d4ff;">${percentage}%</div>
                `;
                rankingList.appendChild(li);
            });

            if (rankingData.length === 0) {
                rankingList.innerHTML = '<li style="color: #666; text-align: center; padding: 10px;">아직 점령된 땅이 없습니다.</li>';
            }
        })
        .catch(err => console.error("Error updating ranking:", err));
}

// --- Initialization Calls ---
updateRankingBoard();
setInterval(updateRankingBoard, 5000); // Refresh ranking every 5 seconds

// Ensure initial view is set
fitToScreen();

// Trigger initial cluster calculation after a short delay to allow chunks to load
// Smart Initialization: Wait for chunks to load before calculating stats
function checkAndRecalculate() {
    if (chunkManager.requestQueue.length > 0 || chunkManager.activeRequests > 0) {
        console.log(`[Loading] Queue: ${chunkManager.requestQueue.length}, Active: ${chunkManager.activeRequests}. Waiting...`);
        setTimeout(checkAndRecalculate, 500); // Check again in 500ms
        return;
    }

    // Safety delay to ensure final fetches processed
    setTimeout(() => {
        recalculateStats();
        recalculateClusters();
        draw();
        console.log(`[Init] Stats & Clusters Updated. PixelMap Size: ${pixelMap.size}`);
    }, 500);
}

// Start the check after a brief initial pause
setTimeout(checkAndRecalculate, 1000);

console.log("Main.js fully loaded and initialized.");
