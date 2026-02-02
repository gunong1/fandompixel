// --- I18n Manager ---
class I18n {
    constructor() {
        this.locale = 'ko'; // Default
        this.messages = {};
    }

    async init() {
        // Detect browser language or saved preference
        const saved = localStorage.getItem('fp_lang');
        if (saved) {
            this.locale = saved;
        } else {
            const browserLang = navigator.language.slice(0, 2);
            this.locale = browserLang === 'ko' ? 'ko' : 'en';
        }
        await this.loadLocale(this.locale);
        this.updateUI();
    }

    async loadLocale(lang) {
        // 1. Define Robust Defaults (Fallback)
        const defaults = {
            "header": { "title": "FANDOM PIXEL", "subtitle": "10,000,000 PIXELS GLOBAL STAGE", "login": "Google Login", "logout": "Logout", "history": "📜 History" },
            "sidebar": { "status_available": "Available", "status_occupied": "Occupied", "owner": "Owner", "idol": "Idol", "none": "None", "description": "Subscribe to this pixel to claim territory for your artist.", "label_nickname": "Nickname", "placeholder_nickname": "Login Required", "label_group": "Group", "price_label": "Price:", "total_subscription_fee": "Total Subscription Fee", "btn_subscribe": "Subscribe Pixel", "area_selected": "Area Selected" },
            "ranking": { "title": "🏆 Fandom<br>Ranking", "loading": "Loading..." },
            "statusbar": { "notice": "📢 Notice", "help": "[F1] Help" },
            "messages": {
                "payment_success": "Purchase Successful!",
                "login_required": "Login required",
                "select_pixels": "Select pixels first",
                "pixel_occupied": "Occupied pixels selected",
                "ticker_prefix": "Just now,",
                "ticker_claimed": " claimed ",
                "ticker_pixels": " pixels of ",
                "ticker_suffix": "!"
            },
            "modal": {
                "share": { "title": "Territory Extended!", "desc": "Save this card to show off!", "btn_download": "💾 Save Image", "btn_close": "Close" },
                "history": { "title": "My Activity", "col_date": "Date", "col_group": "Group", "col_count": "Count", "col_expiry": "Expiry", "empty": "No history found." },
                "help": { "title": "How to Use", "zoom": "Zoom In/Out", "move": "Move Canvas", "center": "Center View", "select": "Select Pixel", "multi_select": "Multi-select", "desc_zoom": "Mouse Wheel", "desc_move": "Ctrl + Drag", "desc_center": "Spacebar", "desc_select": "Click", "desc_multi_select": "Drag", "close": "Close" },
                "notice": {
                    "title": "📢 Notice",
                    "tab_intro": "Project Info",
                    "tab_process": "Donation Process",
                    "tab_refund": "Refund Policy",
                    "tab_faq": "FAQ",
                    "intro": {
                        "headline": "Donation Project",
                        "subline": "Global Fandom Project",
                        "point1": "A portion of pixel sales proceeds is accumulated as donations.",
                        "point2": "At the end of each season, a donation is made in the name of the #1 Fandom.",
                        "point3": "Shine your fandom and share your warm heart!",
                        "season_info": {
                            "title": "📢 Season Info",
                            "duration": "Duration: 3 Months (4 Seasons/Year)",
                            "desc1": "At the end of the season, ranking and territory are permanently archived in the Hall of Fame.",
                            "desc2": "The map resets when a new season starts, but your records remain forever."
                        }
                    },
                    "process": { "title": "Donation Process", "step1_title": "1. Donor Name", "step1_desc": "Donated in the name of the #1 Fandom.", "step2_title": "2. Amount Calculation", "step2_desc": "Percentage of proceeds accumulated.", "step3_title": "3. Beneficiary", "step3_desc": "Donated to themes selected each season.", "step4_title": "4. Result Reporting", "step4_desc": "Receipts released via SNS.", "step5_title": "5. Artist Promotion", "step5_desc": "News distributed via Twitter/Press." },
                    "refund": { "title": "Refund Policy", "desc_title": "Digital Asset Notice", "desc_text": "No refunds due to digital asset nature." },
                    "faq": { "title": "❓ FAQ", "common": { "q1": "Q: Color didn't change?", "a1": "A: Refresh (F5).", "q2": "Q: PayPal?", "a2": "A: Yes.", "q3": "Q: Usage?", "a3": "A: Donated.", "q4": "Q: Ownership?", "a4": "A: 30 days.", "q5": "Q: Nickname?", "a5": "A: Fixed to Google." }, "sec_payment": "1. Payment", "sec_donation": "2. Donation", "sec_general": "3. General" }
                }
            }
        };

        if (lang === 'ko') {
            // Apply Korean overrides to defaults
            defaults.header = { "title": "FANDOM PIXEL", "subtitle": "10,000,000 PIXELS GLOBAL STAGE", "login": "Google 로그인", "logout": "로그아웃", "history": "📜 내역" };
            defaults.sidebar = { "status_available": "구독 가능", "status_occupied": "점령됨", "owner": "소유자", "idol": "아이돌", "none": "없음", "description": "이 픽셀을 구독하여 당신의 아티스트를 위한 영토로 선포하세요.", "label_nickname": "닉네임", "placeholder_nickname": "로그인이 필요합니다", "label_group": "그룹", "price_label": "결제 금액:", "total_subscription_fee": "총 구독료", "btn_subscribe": "픽셀 구독하기" };
            defaults.ranking = { "title": "🏆 Fandom<br>Ranking", "loading": "랭킹 로딩중..." };
            defaults.statusbar = { "notice": "📢 공지", "help": "[F1] 도움말" };
            defaults.messages = {
                "payment_success": "구매가 완료되었습니다!",
                "login_required": "로그인이 필요합니다.",
                "select_pixels": "먼저 픽셀을 선택해주세요.",
                "pixel_occupied": "이미 점령된 픽셀이 포함되어 있습니다.",
                "ticker_prefix": "방금",
                "ticker_claimed": "님이",
                "ticker_pixels": "의",
                "ticker_suffix": "픽셀을 점령했습니다!"
            };
            defaults.modal.share = { "title": "🎉 영토 확장 성공!", "desc": "아래 카드를 저장하여 팬덤을 자랑하세요!", "btn_download": "💾 이미지 저장", "btn_close": "닫기" };
            defaults.modal.history = { "title": "📜 내 활동 내역", "col_date": "구매일", "col_group": "그룹", "col_count": "개수", "col_expiry": "만료일", "empty": "구매 내역이 없습니다." };
            defaults.modal.help = { "title": "사용 방법", "zoom": "캔버스 확대/축소", "move": "캔버스 이동", "center": "화면 중앙 정렬", "select": "픽셀 선택", "multi_select": "다중 픽셀 선택", "desc_zoom": "마우스 휠", "desc_move": "Ctrl + 드래그", "desc_center": "스페이스바", "desc_select": "마우스 클릭", "desc_multi_select": "마우스 드래그", "close": "닫기" };

            // Notice Section Overrides for KO
            defaults.modal.notice.title = "📢 공지사항";
            defaults.modal.notice.tab_intro = "프로젝트 안내";
            defaults.modal.notice.tab_process = "기부 프로세스";
            defaults.modal.notice.tab_refund = "환불 규정";
            defaults.modal.notice.tab_faq = "FAQ";
            defaults.modal.notice.intro = {
                "headline": "\"가장 넓은 땅을 차지한 팬덤의 이름으로<br>기부금이 전달됩니다\"",
                "subline": "FANDOM PIXEL은 전 세계 팬덤이 함께 만드는<br>글로벌 기부 프로젝트입니다.",
                "point1": "픽셀 구매 수익금의 일부는 기부금으로 적립됩니다.",
                "point2": "매 시즌 종료 시, 가장 많은 영토를 점령한<br>1위 팬덤의 명의로 기부가 진행됩니다.",
                "point3": "여러분의 팬덤을 빛내고 따뜻한 마음을 전하세요!",
                "season_info": {
                    "title": "📢 시즌제 안내",
                    "duration": "시즌 기간: 3개월 (연 4회 진행)",
                    "desc1": "시즌 종료 시점의 랭킹과 영토는 '명예의 전당'에 영구 박제됩니다.",
                    "desc2": "새로운 시즌이 시작되면 맵은 초기화되지만, 여러분의 기록은 영원히 남습니다."
                }
            };
            // Add process/refund overrides if needed, but intro.season_info is the critical one missing.
        }

        try {
            console.log(`[I18n] Loading ${lang}...`);
            this.messages = JSON.parse(JSON.stringify(defaults)); // Initialize with defaults

            const response = await fetch(`./locales/${lang}.json?v=${Date.now()}`);
            if (response.ok) {
                const fetched = await response.json();
                // Merge Logic: Overwrite defaults with fetched data
                // BUT if fetched data is missing keys (e.g. stale cache), keep default.
                // Simple recursive merge can be done here? 
                // Alternatively, just trust fetch for top levels, but patch specific nested ones known to be issues.

                this.messages = fetched;

                // FORCE PATCHING nested Season Info if missing in fetched
                if (!this.messages.modal?.notice?.intro?.season_info) {
                    if (!this.messages.modal) this.messages.modal = {};
                    if (!this.messages.modal.notice) this.messages.modal.notice = {};
                    if (!this.messages.modal.notice.intro) this.messages.modal.notice.intro = {};
                    this.messages.modal.notice.intro.season_info = defaults.modal.notice.intro.season_info;
                    console.warn(`[I18n] Patched missing season_info for ${lang}`);
                }
            }
            console.log(`[I18n] Loaded ${lang} success`);
        } catch (e) {
            console.error('Failed to load locale:', e);
            // this.messages is already set to defaults above
        }
    }

    async setLanguage(lang) {
        this.locale = lang;
        localStorage.setItem('fp_lang', lang);
        await this.loadLocale(lang);
        this.updateUI();
    }

    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.messages;

        // Fallback for Critical UI Elements if loading failed or key missing
        if (!value || Object.keys(value).length === 0 || !value[keys[0]]) {
            if (key === 'statusbar.notice') return this.locale === 'ko' ? '📢 공지' : '📢 Notice';
            if (key === 'statusbar.help') return this.locale === 'ko' ? '[F1] 도움말' : '[F1] Help';
            if (key === 'header.title') return "FANDOM PIXEL";
        }

        for (const k of keys) {
            value = value ? value[k] : undefined;
            if (!value) return key;
        }

        // Simple interpolation
        Object.keys(params).forEach(p => {
            if (typeof value === 'string') {
                value = value.replace(`{${p}}`, params[p]);
            }
        });
        return value;
    }

    updateUI() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.innerHTML = this.t(key);
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });

        // Update Switcher Text
        const switcher = document.getElementById('current-lang');
        if (switcher) switcher.innerText = this.locale.toUpperCase();
    }
}

const i18n = new I18n();

// Initialize I18n
document.addEventListener('DOMContentLoaded', async () => {
    await i18n.init();

    // Check for pending mobile payments (Safe to call now that i18n is ready)
    checkPendingPayment();

    // Language Switcher Event
    const langBtn = document.getElementById('lang-switcher');
    if (langBtn) {
        langBtn.addEventListener('click', async () => {
            const nextLang = i18n.locale === 'ko' ? 'en' : 'ko';
            await i18n.setLanguage(nextLang);
        });
    }
});

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

// Loading Indicator
const loadingOverlay = document.getElementById('loading-overlay');
function toggleLoading(show) {
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'block' : 'none';
        // Force redraw if hiding loading to ensure clean state
        if (!show) draw();
    }
}

class ChunkManager {
    constructor(chunkSize) {
        this.chunkSize = chunkSize;
        this.loadedChunks = new Set();
        this.pendingChunks = new Set();
        this.requestQueue = [];
        this.activeRequests = 0;
        this.maxConcurrentRequests = 6;
        this.controllers = new Map(); // Store AbortControllers
    }

    // --- Tile Map Service Implementation ---
    // Instead of rendering pixels to an offscreen canvas, we load PNG tiles from the server.
    // We only fetch binary pixel data if the user is zoomed in enough to interact.

    updateVisibleChunks(minX, minY, maxX, maxY) {
        // TILE_SIZE = 256 world units
        const TILE_SIZE = 256;

        // Convert world bounds to tile coordinates
        const minTileX = Math.floor(minX / TILE_SIZE);
        const minTileY = Math.floor(minY / TILE_SIZE);
        const maxTileX = Math.floor(maxX / TILE_SIZE);
        const maxTileY = Math.floor(maxY / TILE_SIZE);

        const currentTiles = new Set();

        // Determine Load Mode: Image (Tiles) vs Data (Binary)
        // If scale is large enough (e.g., > 1.0, meaning 1px >= 1 screen px), load data for interaction.
        // Actually, users might want to see who owns a pixel even at lower zoom. 
        // Let's set a threshold. scale=0.5 means 1 pixel = 0.5 screen pixels.
        const LOAD_DATA_THRESHOLD = 0; // Force always load
        const shouldLoadData = scale >= LOAD_DATA_THRESHOLD;

        const totalTiles = (maxTileX - minTileX + 1) * (maxTileY - minTileY + 1);

        // --- SAFETY LIMIT ---
        // If zooming out too much, user would request 60,000+ tiles.
        // We limit visible tiles to ~150. If more, we stop rendering or render a placeholder.
        if (totalTiles > 200) {
            // console.warn("[TMS] Too many tiles visible, skipping render for performance.");
            return;
        }

        for (let y = minTileY; y <= maxTileY; y++) {
            for (let x = minTileX; x <= maxTileX; x++) {
                const key = `${x},${y}`;
                currentTiles.add(key);

                // 1. Load Tile Image (Always, for base layer)
                if (!this.loadedChunks.has(key) && !this.pendingChunks.has(key)) {
                    this.pendingChunks.add(key);
                    // Load Image
                    const img = new Image();
                    img.src = `/api/pixels/tile?x=${x}&y=${y}&t=${Date.now()}`; // Add timestamp to bypass cache if needed, or rely on Cache-Control
                    img.onload = () => {
                        chunkImages.set(key, img); // caching image directly
                        this.loadedChunks.add(key);
                        this.pendingChunks.delete(key);
                        needsRedraw = true;
                    };
                    img.onerror = () => {
                        this.pendingChunks.delete(key);
                        // Retry?
                    };
                }

                // 2. Load Binary Data (Only if high zoom) for interaction info
                if (shouldLoadData) {
                    const dataKey = `data_${key}`;
                    if (!pixelChunks.has(key) && !this.pendingChunks.has(dataKey)) {
                        this.pendingChunks.add(dataKey);
                        // Fetch Data
                        // We can reuse fetchChunk but need to adapt it to tile coordinates
                        // TILE_SIZE (256) != Old Chunk Size (1000). 
                        // The server /api/pixels/chunk expects minX, maxX etc.
                        const dMinX = x * TILE_SIZE;
                        const dMinY = y * TILE_SIZE;
                        const dMaxX = dMinX + TILE_SIZE;
                        const dMaxY = dMinY + TILE_SIZE;

                        this.fetchChunkData(x, y, dMinX, dMinY, dMaxX, dMaxY, dataKey);
                    }
                }
            }
        }

        // Cleanup Off-screen Tiles (Optional, for memory)
        // ... (Keep existing cleanup logic if desired, adapted for images)
    }

    async fetchChunkData(tx, ty, minX, minY, maxX, maxY, key) {
        // Optimized JSON Fetching
        const controller = new AbortController();
        this.controllers.set(key, controller);

        try {
            const res = await fetch(`/api/pixels/chunk?minX=${minX}&minY=${minY}&maxX=${maxX}&maxY=${maxY}&format=json&t=${Date.now()}`, {
                signal: controller.signal
            });
            if (!res.ok) throw new Error("Data fetch failed");

            const pixels = await res.json();

            if (pixels && pixels.length > 0) {
                // console.log(`[DATA] Loaded ${pixels.length} pixels for tile ${tx},${ty}`);
                pixels.forEach(p => {
                    const pKey = `${p.x},${p.y}`;
                    pixelMap.set(pKey, p);
                });
                needsRedraw = true; // Force redraw after loading
            }

            // Mark data as loaded for this tile
            // Also store count or some meta if needed
            pixelChunks.set(`${tx},${ty}`, true);

        } catch (e) {
            if (e.name === 'AbortError') {
                // console.log(`Chunk ${key} load aborted`);
            } else {
                console.error("Chunk data load error:", e);
            }
        } finally {
            this.pendingChunks.delete(key);
            this.controllers.delete(key);
        }
    }

    invalidateChunk(cx, cy) {
        // Fix: Map CHUNK_SIZE (1000) coordinates to TILE_SIZE (256) keys
        // to correctly invalidate the visual tiles.

        const cSize = this.chunkSize || 1000;
        const TILE_SIZE = 256; // Redefine TILE_SIZE locally for this method
        const minX = cx * cSize;
        const minY = cy * cSize;
        const maxX = minX + cSize;
        const maxY = minY + cSize;

        const tMinX = Math.floor(minX / TILE_SIZE);
        const tMinY = Math.floor(minY / TILE_SIZE);
        const tMaxX = Math.ceil(maxX / TILE_SIZE);
        const tMaxY = Math.ceil(maxY / TILE_SIZE);

        for (let y = tMinY; y <= tMaxY; y++) {
            for (let x = tMinX; x <= tMaxX; x++) {
                const key = `${x},${y}`;
                this.loadedChunks.delete(key);

                // Clear Image Cache
                if (typeof chunkImages !== 'undefined' && chunkImages.has(key)) {
                    chunkImages.delete(key);
                }

                // Clear Data Load Status
                if (typeof pixelChunks !== 'undefined' && pixelChunks.has(key)) {
                    // pixelChunks stores data loading status (boolean) for tiles
                    // clearing it forces re-fetch of binary data if needed
                    pixelChunks.delete(key);
                }
            }
        }
    }

    async processQueue() {
        if (this.activeRequests >= this.maxConcurrentRequests || this.requestQueue.length === 0) {
            if (this.activeRequests === 0 && this.requestQueue.length === 0) {
                toggleLoading(false);
            }
            return;
        }

        while (this.activeRequests < this.maxConcurrentRequests && this.requestQueue.length > 0) {
            const req = this.requestQueue.shift();
            // Since we switched to tile images, the old loadChunk logic is obsolete.
            // We keep this method structure to avoid breakage if anything calls it,
        }
    }
}

// Socket Connection (Already declared below but we ensure singleton)
// const socket = io(); // REMOVED DUPLICATE

// End of ChunkManager class (Already closed above)


// Ensure the socket is available (it's declared at top, but just in case)
// ...
// End of redundant duplication
// The ChunkManager instance is created at the bottom of the file or after the original class definition.
// End of redundant duplication cleaned up.

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

// --- Populate Idol Dropdown (Sorted Alphabetically) ---
if (idolSelect) {
    const sortedIdolNames = Object.keys(idolInfo).sort((a, b) => a.localeCompare(b));
    sortedIdolNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        idolSelect.appendChild(option);
    });
}

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
    // OPTIMIZATION: Integer coordinates for sharper rendering and performance
    ctx.translate(Math.round(offsetX), Math.round(offsetY));
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

    // Draw World Border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 10 / scale;
    ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);


    // Trigger Loads (Only if zoomed in)
    chunkManager.updateVisibleChunks(minVisibleX, minVisibleY, maxVisibleX, maxVisibleY);

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

    // --- Draw Tile Images ---
    // Iterate over visible tiles
    const TILE_SIZE = 256;
    const viewMinX = minVisibleX; // Use the already calculated minVisibleX/Y
    const viewMinY = minVisibleY;
    const viewMaxX = maxVisibleX;
    const viewMaxY = maxVisibleY;

    const startTileX = Math.floor(viewMinX / TILE_SIZE);
    const startTileY = Math.floor(viewMinY / TILE_SIZE);
    const endTileX = Math.floor(viewMaxX / TILE_SIZE);
    const endTileY = Math.floor(viewMaxY / TILE_SIZE);

    for (let ty = startTileY; ty <= endTileY; ty++) {
        for (let tx = startTileX; tx <= endTileX; tx++) {
            const key = `${tx},${ty}`;
            const img = chunkImages.get(key);
            if (img && img.complete) {
                // Determine destination on canvas
                // World coordinates of tile:
                const wX = tx * TILE_SIZE;
                const wY = ty * TILE_SIZE;

                // Screen coordinates
                // Note: p.x * GRID_SIZE? No. TILE_SIZE=256 is correct if 1 world unit = 1 pixel.
                // But earlier we saw `const chunkMinX = cx * this.chunkSize`.
                // wait, if TILE_SIZE=256, and we draw it.
                // Does 1 unit in X mean 20 pixels on screen?
                // The GRID_SIZE is 20.
                // If the DB x is 0, drawing at screen x = 0.
                // If DB x is 1, drawing at screen x = 20.
                // So the *World Coordinate System* used in Logic is `x * GRID_SIZE`.

                // If the server generated a 256x256 PNG for x=0..256, y=0..256 range.
                // That cover 256 "cells".
                // On canvas, that covers 256 * GRID_SIZE pixels.

                const screenX = (wX * GRID_SIZE * scale) + offsetX;
                const screenY = (wY * GRID_SIZE * scale) + offsetY;
                const screenW = TILE_SIZE * GRID_SIZE * scale;
                const screenH = TILE_SIZE * GRID_SIZE * scale;

                // Optimization: Don't draw if off-screen (handled by loop indices mostly)
                // Draw Image
                // We must use `imageSmoothingEnabled = false` for pixel art look
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(img, screenX, screenY, screenW, screenH);
            }
        }
    }


    // --- Draw Live Pixels (Direct Map Iteration) ---
    // FIX: Reset transform so manual screen coordinate calcs work correctly (Absolute Screen Space)
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    let debugCount = 0;
    pixelMap.forEach(p => {
        // Simple View Culling
        if (p.x >= viewMinX && p.x <= viewMaxX && p.y >= viewMinY && p.y <= viewMaxY) {

            if (debugCount < 3) {
                // Throttle log to once per 5 seconds or just rely on manual refresh
                // console.log(`[DRAW] Pixel ${p.x},${p.y} ${p.color}`); 
                debugCount++;
            }

            // Fix: p.x/y are already world coordinates, do NOT multiply by GRID_SIZE again.
            const pScreenX = (p.x * scale) + offsetX;
            const pScreenY = (p.y * scale) + offsetY;

            // Fix: Enforce minimum visibility size when zoomed out
            // If scale is small, 1px is invisible. Force minimum size.
            let pSize = Math.ceil(GRID_SIZE * scale);
            if (pSize < 3) pSize = 3; // Minimum 3px dot

            ctx.fillStyle = p.color;
            ctx.fillRect(pScreenX, pScreenY, pSize, pSize);
        }
    });
    ctx.restore();

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

// --- Initial Load Strategy (Hybrid) ---
async function fetchAllPixels() {
    try {
        toggleLoading(true);
        console.log('[Data] Fetching all pixels for initial view...');
        const res = await fetch('/api/pixels?t=' + Date.now());
        if (!res.ok) throw new Error('Failed to fetch initial pixels');
        const pixels = await res.json();

        console.log(`[Data] Loaded ${pixels.length} pixels.`);
        pixels.forEach(p => {
            updatePixelStore(p, false); // Store without individual redraws
        });

        needsRedraw = true;
        draw();
    } catch (e) {
        console.error("Initial load failed:", e);
    } finally {
        toggleLoading(false);
    }
}

// Start
fetchAllPixels();
updateRankingBoard();
draw(); // This will trigger _render


socket.on('pixel_update', (pixel) => {
    updatePixelStore(pixel);

    // Check selection update
    if (selectedPixels.length === 1 && selectedPixels[0].x === pixel.x && selectedPixels[0].y === pixel.y) {
        updateSidePanel(pixel);
    }
});

socket.on('batch_pixel_update', (pixels) => {
    const affectedChunks = new Set();

    // Optimization: Batch update without redundant redraws
    pixels.forEach(p => {
        updatePixelStore(p, false);
        // Track chunk to invalidate
        const k = getChunkKey(p.x, p.y);
        affectedChunks.add(k);
    });

    // Invalidate affected chunks so they redraw from data
    affectedChunks.forEach(key => {
        const [cx, cy] = key.split(',').map(Number);
        chunkManager.invalidateChunk(cx, cy);
    });

    needsRedraw = true;
    draw();
});

// Simple redraw
draw();


// NEW: Batch Update Listener
// (Removed duplicate batch_pixel_update listener)


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


// --- Pricing Logic ---
function getPixelPrice(x, y) {
    // Calculate distance from center (Square / Chebyshev Distance for Grid)
    const centerX = WORLD_SIZE / 2;
    const centerY = WORLD_SIZE / 2;

    // Use Box Radius instead of Circle Radius
    const dist = Math.max(Math.abs(x - centerX), Math.abs(y - centerY));

    // Zone 1: High Value (Center +/- 2000px box) - 2000 KRW
    if (dist <= 2000) return 2000;

    // Zone 2: Mid Value (Center +/- 12000px box) - 1000 KRW
    if (dist <= 12000) return 1000;

    // Zone 3: Standard (Rest of the world) - 500 KRW
    return 500;
}

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
        selectedPixelCountDiv.textContent = i18n.t('messages.select_pixels_count', { count: totalSelected }) || `Total ${totalSelected} pixels selected`;
        selectedPixelCountDiv.style.display = 'block';

        // OPTIMIZATION: fast check using Map.has() O(1)
        // FIX: Retrieving full pixel objects allows us to display owner info correctly
        const ownedInSelection = validSelectedPixels
            .filter(p => pixelMap.has(`${p.x},${p.y}`))
            .map(p => pixelMap.get(`${p.x},${p.y}`));

        const unownedInSelection = validSelectedPixels.filter(p => !pixelMap.has(`${p.x},${p.y}`));

        if (unownedInSelection.length > 0) { // There are unowned pixels
            purchaseForm.style.display = 'block';

            // Auto-fill Nickname if Logged In

            // Robust Fallback: Check DOM if currentUser var is missing but UI shows login
            let effectiveNickname = currentUser ? currentUser.nickname : null;
            if (!effectiveNickname) {
                const userNicknameEl = document.getElementById('user-nickname');
                const userInfoEl = document.getElementById('user-info');
                // If user-info is visible and nickname is present, trust the DOM
                if (userInfoEl && userInfoEl.style.display !== 'none' && userNicknameEl && userNicknameEl.textContent.trim()) {
                    effectiveNickname = userNicknameEl.textContent.trim();
                }
            }

            if (effectiveNickname && nicknameInput) {
                nicknameInput.value = effectiveNickname;
                nicknameInput.readOnly = true;
                nicknameInput.disabled = false;
                // Fix placeholder style in case it was stuck in guest mode
                nicknameInput.style.backgroundColor = '#333';
            } else if (!effectiveNickname && nicknameInput) {
                // Ensure guest state if NOT logged in (fix for half-state)
                nicknameInput.value = '';
                nicknameInput.disabled = true;
                nicknameInput.placeholder = i18n.t('sidebar.placeholder_nickname');
            }

            if (ownedInSelection.length > 0) {
                statusTag.textContent = i18n.t('sidebar.status_mixed', { count: unownedInSelection.length, owned: ownedInSelection.length }) || `${unownedInSelection.length} available (${ownedInSelection.length} owned)`;
                statusTag.style.background = '#ff9800'; // Orange for mixed
            } else {
                // NEW: Show Total Subscription Fee instead of traditional Area ID
                const unitPrice = getPixelPrice(selectedPixels[0].x, selectedPixels[0].y);
                const titleKey = i18n.t('sidebar.total_subscription_fee');

                if (i18n.locale === 'en') {
                    const usdPrice = (unitPrice / 1000).toFixed(2);
                    areaIdText.innerHTML = `${titleKey}: <br>$ ${usdPrice}`;
                } else {
                    areaIdText.innerHTML = `${titleKey}: <br>₩ ${unitPrice.toLocaleString()}`;
                }

                statusTag.textContent = i18n.t('sidebar.status_available');
                statusTag.style.background = '#00d4ff'; // Blue for all unowned
            }

            // Calculate Price
            let startPrice = 0;
            if (totalSelected === 1) {
                startPrice = getPixelPrice(validSelectedPixels[0].x, validSelectedPixels[0].y);
            } else {
                // If multiple selected, sum up prices
                startPrice = validSelectedPixels.reduce((sum, p) => sum + getPixelPrice(p.x, p.y), 0);
            }

            // Update header and price label with correct currency
            const titleKey = i18n.t('sidebar.total_subscription_fee') || 'Total Fee';
            const priceLabel = document.querySelector('label[for="idol-select"]');
            const pixelPriceSpan = document.getElementById('pixel-price');

            if (i18n.locale === 'en') {
                const usdPrice = (startPrice / 1000).toFixed(2);
                if (totalSelected > 1) {
                    areaIdText.innerHTML = `${titleKey}: <br>$ ${usdPrice}`;
                }
                if (pixelPriceSpan) {
                    pixelPriceSpan.textContent = `$${usdPrice}`;
                }
            } else {
                if (totalSelected > 1) {
                    areaIdText.innerHTML = `${titleKey}: <br>₩ ${startPrice.toLocaleString()}`;
                }
                if (pixelPriceSpan) {
                    pixelPriceSpan.textContent = `₩${startPrice.toLocaleString()}`;
                }
            }

            // Original price display logic for unowned pixels (kept for now, but might be redundant with new price display)
            const totalPriceKRW = unownedInSelection.reduce((sum, p) => sum + getPixelPrice(p.x, p.y), 0);
            const priceEl = document.getElementById('payment-info-price');
            if (i18n.locale === 'en') {
                const totalPriceUSD = (totalPriceKRW / 1000).toFixed(2);
                if (priceEl) priceEl.innerText = `$ ${totalPriceUSD}`;
            } else {
                if (priceEl) priceEl.innerText = `₩ ${totalPriceKRW.toLocaleString()}`;
            }

        } else if (totalSelected === 1 && ownedInSelection.length === 1) {
            // Single Owned Pixel
            pixelInfo.style.display = 'block';
            statusTag.textContent = i18n.t('sidebar.status_occupied');
            statusTag.style.background = '#ff0055';

            const p = ownedInSelection[0];
            // Standardize Header to match "Area Selected" style requested by user
            areaIdText.innerText = i18n.t('sidebar.area_selected');

            ownerNickname.innerText = p.owner_nickname || i18n.t('sidebar.none');
            const groupName = p.idol_group_name || i18n.t('sidebar.none');

            // Fix: Ensure idolGroup element is updated
            if (idolGroup) {
                idolGroup.innerText = groupName;
                idolGroup.style.color = (idolInfo[groupName] && idolInfo[groupName].color) ? idolInfo[groupName].color : '#fff';
            }

            // Show Owner Stats (Standardized)
            if (ownerStatsDiv) {
                const owner = p.owner_nickname;
                const group = p.idol_group_name;

                if (owner && group) {
                    const userGroupKey = `${owner}:${group}`;
                    const ownerCount = userGroupPixelCounts.get(userGroupKey) || 0;
                    const totalWorldPixels = Math.pow(Math.floor(WORLD_SIZE / GRID_SIZE), 2);
                    const marketShare = ((ownerCount / totalWorldPixels) * 100).toFixed(4);

                    const statsLabel = i18n.t('sidebar.owner_stats') || "Ownership Info";
                    const statsValue = i18n.t('sidebar.owner_stats_value', {
                        count: ownerCount.toLocaleString(),
                        percent: marketShare
                    });

                    ownerStatsDiv.innerHTML = `<span>${statsLabel}</span> <span>${statsValue}</span>`;
                    ownerStatsDiv.style.display = 'flex';
                } else {
                    ownerStatsDiv.style.display = 'none';
                }
            }

        } else if (ownedInSelection.length > 0) { // All selected pixels are owned (multiple pixels)
            pixelInfo.style.display = 'block';
            statusTag.textContent = i18n.t('sidebar.status_occupied');
            statusTag.style.background = '#ff4d4d'; // Red for all owned
            ownerNickname.textContent = '-';
            idolGroup.textContent = '-';
            areaIdText.innerText = i18n.t('messages.selected_owned_pixels', { count: totalSelected });

            // Refactored: Display owner info if exactly one owner is found across all selected pixels
            // 1. Get unique owners
            const uniqueOwners = [...new Set(ownedInSelection.map(p => p.owner_nickname))];

            if (uniqueOwners.length === 1) {
                const samplePixel = ownedInSelection[0];
                ownerNickname.textContent = samplePixel.owner_nickname;
                idolGroup.textContent = samplePixel.idol_group_name;

                // Always show "Area Selected" for consistency as requested
                areaIdText.innerText = i18n.t('sidebar.area_selected');

                // --- NEW: Calculate and Show Owner Stats (Specific to Group) ---
                // const ownerCount = userPixelCounts.get(samplePixel.owner_nickname) || 0; // OLD: Global count

                const userGroupKey = `${samplePixel.owner_nickname}:${samplePixel.idol_group_name}`;
                const ownerCount = userGroupPixelCounts.get(userGroupKey) || 0;

                // Calculate Market Share (Percentage of TOTAL WORLD)
                // Total grid cells = (WORLD_SIZE / GRID_SIZE) ^ 2
                const totalWorldPixels = Math.pow(Math.floor(WORLD_SIZE / GRID_SIZE), 2);
                const marketShare = ((ownerCount / totalWorldPixels) * 100).toFixed(4); // Show 4 decimal places for precision

                if (ownerStatsDiv) {
                    const statsLabel = i18n.t('sidebar.owner_stats') || "Ownership Info";
                    // Pass raw numbers if i18n handles formatting, or formatted strings if placeholders expect string.
                    // Given our JSON uses {percent}%, we pass the number string.
                    const statsValue = i18n.t('sidebar.owner_stats_value', {
                        count: ownerCount.toLocaleString(),
                        percent: marketShare
                    }) || `${ownerCount.toLocaleString()} (${marketShare}%)`;

                    ownerStatsDiv.innerHTML = `<span>${statsLabel}</span> <span>${statsValue}</span>`;
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


// Check for pending mobile payments moved to DOMContentLoaded
// checkPendingPayment();

// --- Payment Recovery Logic (For Mobile Redirects) ---
async function checkPendingPayment() {
    console.log("[Payment Recovery] Checking for pending transactions...");
    const pendingData = localStorage.getItem('pending_payment');

    if (!pendingData) {
        console.log("[Payment Recovery] No pending payment found.");
        return;
    }

    try {
        const paymentState = JSON.parse(pendingData);

        // CRITICAL: Check for PortOne V2 response params in URL
        // Only proceed if we have actual payment success indicators
        const urlParams = new URLSearchParams(window.location.search);
        const urlPaymentId = urlParams.get('paymentId');
        const impSuccess = urlParams.get('imp_success'); // PortOne V1 legacy
        const code = urlParams.get('code');
        const message = urlParams.get('message');

        // STRICT VALIDATION: Require URL confirmation of payment
        // If user pressed back button, there will be NO URL params
        if (!urlPaymentId && !impSuccess) {
            console.log("[Payment Recovery] No payment confirmation in URL. User likely cancelled or navigated back.");
            console.log("[Payment Recovery] Clearing pending state to prevent false positive.");
            localStorage.removeItem('pending_payment');
            return;
        }

        // Check for error indicators in URL
        if (code != null) {
            // It's a response (either success or fail)
            if (code !== '0' && code !== undefined) {
                // If message exists, it might be an error.
                if (paramsHaveError(urlParams)) {
                    console.error("[Payment Recovery] Payment likely failed:", message);
                    alert(`결제 실패 (이동 후): ${message || 'Unknown error'}`);
                    localStorage.removeItem('pending_payment');
                    return;
                }
            }
        }


        // Logic: checking if this pending payment is relevant. 
        // We assume valid because we clear it immediately after processing.
        console.log("[Payment Recovery] Found pending payment state:", paymentState);

        const { pixelsToSend, idolGroupName, nickname, baseColor, paymentId } = paymentState;

        // Re-construct logic from success handler
        console.log(`[Payment Recovery] Restoring purchase for ${pixelsToSend.length} pixels...`);

        // Generate Pixels Payload
        // Re-use color generation or saved color
        let color = baseColor;
        if (!color) {
            // Fallback generation if not saved (backward compat)
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
        }

        const pixelsPayload = pixelsToSend.map(p => ({
            x: p.x,
            y: p.y,
            color: color,
            idol_group_name: idolGroupName,
            owner_nickname: nickname
        }));

        // Batch Emit
        const CHUNK_SIZE = 50000;
        for (let i = 0; i < pixelsPayload.length; i += CHUNK_SIZE) {
            const chunk = pixelsPayload.slice(i, i + CHUNK_SIZE);
            socket.emit('batch_new_pixels', chunk);
        }

        alert('구매가 완료되었습니다! (모바일 복귀)');

        // UI Cleanup
        if (sidePanel) sidePanel.style.display = 'none';

        // Restore nickname from payment state to avoid "Login Required" flicker
        if (nicknameInput) {
            nicknameInput.value = nickname;
            nicknameInput.disabled = false; // Enabled but read-only for logged in
            nicknameInput.readOnly = true;
            nicknameInput.placeholder = i18n.t('sidebar.placeholder_nickname');

            // Ensure style matches logged-in state
            nicknameInput.style.backgroundColor = '#333';
        }

        selectedPixels = [];
        draw();

        // Trigger Share Card
        setTimeout(() => {
            generateShareCard(idolGroupName, pixelsToSend.length, color, pixelsToSend);
        }, 500);

    } catch (e) {
        console.error("[Payment Recovery] Error processing pending payment:", e);
        alert("결제 복구 중 오류가 발생했습니다.");
    } finally {
        // Always clear to prevent infinite loops
        localStorage.removeItem('pending_payment');
        // Optional: Clean URL params
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }
}

// Helper to detect error in URL params (PortOne specific)
function paramsHaveError(params) {
    // If 'code' present and not success-like? 
    // Standard PortOne V1 uses error_msg, V2 uses code/message.
    // Let's assume safely: if `message` is present, it's usually an error description?
    // Or strictly rely on `code`. 
    // If `paymentId` is present, it's usually success.

    if (params.get('code') && params.get('code') !== '0' && params.get('code') !== 'SUCCESS') return true;
    // Note: Some PGs return logic differently. 
    // Simplest: If paymentId is present, we proceed.
    return false;
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
                nicknameInput.placeholder = i18n.t('purchase_form.nickname_placeholder');
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
    try {
        console.log('[DEBUG] Purchase button clicked start');

        // --- Validation ---
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

        // --- SDK Check ---
        if (typeof PortOne === 'undefined') {
            throw new Error("결제 모듈(PortOne)이 로드되지 않았습니다. 페이지를 새로고침 해주세요.");
        }

        const totalAmount = pixelsToSend.reduce((sum, p) => sum + getPixelPrice(p.x, p.y), 0);
        const paymentId = `payment-${Math.random().toString(36).slice(2, 11)}`;

        console.log(`[PAYMENT] Requesting payment for ${pixelsToSend.length} pixels (Total: ₩${totalAmount})`);

        // --- Payment Channel & Currency Logic ---
        let finalAmount = totalAmount;
        let finalCurrency = "KRW"; // Changed from CURRENCY_KRW
        let targetChannelKey = "channel-key-c55bfde2-056f-414f-b62c-cf4d2faddfdf"; // Default: Toss (Domestic)

        // Base Request Object
        const paymentRequest = {
            storeId: "store-81d6360b-5e80-4765-b7df-09333509eb04",
            paymentId: paymentId,
            orderName: `Idolpixel: ${pixelsToSend.length} pixels`,
            customer: {
                fullName: nickname,
                email: currentUser ? currentUser.email : undefined,
            },
            // Note: totalAmount is set below
        };

        if (i18n.locale === 'en') {
            // USD Logic (PayPal)
            const exchangeRate = 1000;
            // Fix: PortOne PayPal integration seems to interpret integer '1' as '1 cent' ($0.01).
            // We need to send correct CENTS value.
            let usdDollars = totalAmount / exchangeRate;
            let usdCents = Math.round(usdDollars * 100);

            // Enforce Minimum $0.01 (1 Cent)
            if (usdCents < 1) usdCents = 1;

            finalAmount = usdCents;

            finalCurrency = "USD";
            targetChannelKey = "channel-key-1eb29f8d-3668-4489-b9b6-7ab82c4df49c"; // PayPal (Restored Correct Key)

            paymentRequest.totalAmount = finalAmount;
            paymentRequest.currency = "USD";
            paymentRequest.channelKey = targetChannelKey;
            paymentRequest.payMethod = "PAYPAL";
        } else {
            // KRW Logic (Toss)
            finalAmount = totalAmount;
            finalCurrency = "KRW";
            targetChannelKey = "channel-key-c55bfde2-056f-414f-b62c-cf4d2faddfdf"; // Toss

            paymentRequest.totalAmount = finalAmount;
            paymentRequest.currency = "KRW";
            paymentRequest.channelKey = targetChannelKey;
            paymentRequest.payMethod = "CARD";
        }


        console.log(`[PAYMENT] Mode: ${i18n.locale}, Channel: ${targetChannelKey}, Amount: ${finalAmount} ${finalCurrency}`);


        // Helper: Mobile Detection
        function isMobile() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }

        // --- Persist State for Mobile Redirects ---
        // We save before requestPayment because mobile will redirect immediately
        console.log("[PAYMENT] Saving pending state for mobile recovery...");
        const paymentState = {
            pixelsToSend: pixelsToSend,
            idolGroupName: idolGroupName,
            nickname: nickname,
            paymentId: paymentId,
            baseColor: null, // Will calculate below to save consistent color
            timestamp: Date.now()
        };

        // Pre-calculate color to ensure consistency
        if (idolInfo[idolGroupName]) {
            paymentState.baseColor = idolInfo[idolGroupName].color;
        } else {
            let hash = 0;
            for (let i = 0; i < idolGroupName.length; i++) {
                hash = idolGroupName.charCodeAt(i) + ((hash << 5) - hash);
            }
            const h = Math.abs(hash) % 360;
            paymentState.baseColor = `hsla(${h}, 70%, 60%, 0.7)`;
        }

        localStorage.setItem('pending_payment', JSON.stringify(paymentState));


        // --- Request Payment ---
        // Add redirectUrl for Mobile Environments to prevent popup blocking and ensure return
        if (isMobile()) {
            console.log("[PAYMENT] Mobile environment detected. Requesting Session Recovery Token...");

            try {
                // Request One-Time Session Recovery Token
                const tokenRes = await fetch('/api/auth/recovery-token', { method: 'POST' });
                if (tokenRes.ok) {
                    const tokenData = await tokenRes.json();
                    if (tokenData.token) {
                        console.log(`[PAYMENT] Recovery Token obtained: ${tokenData.token}`);
                        // Append token to redirect URL
                        const returnUrl = new URL(window.location.origin + window.location.pathname);
                        returnUrl.searchParams.set('restore_session', tokenData.token);
                        paymentRequest.redirectUrl = returnUrl.toString();
                    }
                } else {
                    console.warn("[PAYMENT] Failed to get recovery token. Proceeding without session recovery.");
                    paymentRequest.redirectUrl = window.location.origin + window.location.pathname;
                }
            } catch (e) {
                console.error("[PAYMENT] Error fetching recovery token:", e);
                paymentRequest.redirectUrl = window.location.origin + window.location.pathname;
            }
        }

        const response = await PortOne.requestPayment(paymentRequest);

        if (response.code !== undefined) {
            console.error("Payment failed:", response); // Log full response for debugging
            return alert(`결제 실패: ${response.message}`);
        }

        // --- Payment Success Logic ---
        console.log("Payment Success! Updating pixels...");

        // Generate Color
        let color = '#ffffff';
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

        const pixelsPayload = [];
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
        const CHUNK_SIZE = 50000;
        const totalChunks = Math.ceil(pixelsPayload.length / CHUNK_SIZE);

        console.log(`Sending ${pixelsPayload.length} pixels to server...`);

        for (let i = 0; i < pixelsPayload.length; i += CHUNK_SIZE) {
            const chunk = pixelsPayload.slice(i, i + CHUNK_SIZE);
            socket.emit('batch_new_pixels', chunk);
        }

        alert('구매가 완료되었습니다!');

        // Clear pending state on successful in-context completion
        localStorage.removeItem('pending_payment');

        sidePanel.style.display = 'none';

        // Restore nickname to maintain logged-in state in UI
        if (nicknameInput) {
            nicknameInput.value = nickname;
            nicknameInput.disabled = false;
            nicknameInput.readOnly = true;
            nicknameInput.style.backgroundColor = '#333';
        }

        selectedPixels = [];
        draw();

        // Trigger Share Card
        setTimeout(() => {
            generateShareCard(idolGroupName, pixelsToSend.length, color, pixelsToSend);
        }, 500);

    } catch (e) {
        console.error("Critical Purchase Error:", e);
        alert("Critical Purchase Error: " + e.message);
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
    const container = document.getElementById('minimap-container');
    const mv = document.getElementById('minimap-view');
    if (!container || !mv) return;

    // Use actual container size (minus borders if needed, but offsetWidth is usually safe for this calc)
    // Minimap is a square, so width is sufficient
    const mmSize = container.offsetWidth;
    const mmScale = mmSize / WORLD_SIZE;

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
let isMultiTouch = false; // Flag to prevent accidental clicks during pinch/zoom
const LONG_PRESS_DURATION = 250; // ms (0.25s)

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent scrolling

    // Multi-touch Detection
    if (e.touches.length > 1) {
        isMultiTouch = true;
    }

    if (e.touches.length === 1) {
        // If coming from a multi-touch state, ignore this "single" touch start until reset
        if (isMultiTouch) return;

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
            if (isMultiTouch) return; // Verify again
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
        }, 150);

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
        if (isMultiTouch) return; // Ignore movement if part of multi-touch gesture

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
            // Updated Scale Limit from 0.01 to 0.0005 to match Wheel Zoom
            const newScale = Math.max(0.0005, Math.min(20, scale * zoomFactor));

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

    // MULTI-TOUCH EXIT GUARD
    if (isMultiTouch) {
        // If all fingers are lifted, reset the flag
        if (e.touches.length === 0) {
            isMultiTouch = false;
        }
        // CRITICAL: Return immediately to prevent 'tap' execution
        return;
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




// --- Share Card Feature ---
// --- Share Card Feature ---
// Move event binding to a safe check loop or function
function setupShareHandlers() {
    const closeShareBtn = document.getElementById('close-share-btn');
    const downloadCardBtn = document.getElementById('download-card-btn');
    const shareModal = document.getElementById('share-modal');
    const shareCardImg = document.getElementById('share-card-img');

    if (closeShareBtn && shareModal) {
        closeShareBtn.addEventListener('click', () => {
            shareModal.style.display = 'none';
        });
    }

    if (downloadCardBtn && shareCardImg) {
        downloadCardBtn.addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = `idolpixel-share-${Date.now()}.png`;
            link.href = shareCardImg.src;
            link.click();
        });
    }
}
// Try to setup immediately, and also on load
setupShareHandlers();
window.addEventListener('DOMContentLoaded', setupShareHandlers);
window.addEventListener('load', setupShareHandlers);

function generateShareCard(idolName, pixelCount, baseColor, purchasedPixels) {
    console.log(`[ShareCard] Generating for ${idolName}, count: ${pixelCount}, pixels: ${purchasedPixels ? purchasedPixels.length : 0}`);

    // Dynamic Retrieval to prevent null errors
    const shareModal = document.getElementById('share-modal');
    const shareCardImg = document.getElementById('share-card-img');

    if (!shareModal || !shareCardImg) {
        console.error("[ShareCard] Modal elements not found in DOM!");
        return;
    }

    const width = 600;
    const height = 400;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = width;
    offCanvas.height = height;
    const ctx = offCanvas.getContext('2d');

    // 2. Draw Background
    baseColor = baseColor || '#333';
    ctx.fillStyle = '#1a1f2c';
    ctx.fillRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, baseColor);
    gradient.addColorStop(1, '#000000');
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1.0;

    // 3. Draw Map Snapshot (Smart Zoom + Isolated View)
    const mapWidth = 560;
    const mapHeight = 220;
    const mapX = 20;
    const mapY = 100;

    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(mapX, mapY, mapWidth, mapHeight, 10);
    } else {
        ctx.rect(mapX, mapY, mapWidth, mapHeight);
    }
    ctx.clip();

    // Draw Dark Background for Map Area
    ctx.fillStyle = '#111';
    ctx.fillRect(mapX, mapY, mapWidth, mapHeight);

    // --- SMART ZOOM LOGIC ---
    if (purchasedPixels && purchasedPixels.length > 0) {
        // 1. Calculate Bounding Box of Purchased Pixels
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        purchasedPixels.forEach(p => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        });

        // 2. Add Padding (e.g., 50 units around)
        // If single pixel, we want a nice zoom, not infinite.
        const PADDING = 60;
        minX -= PADDING;
        minY -= PADDING;
        maxX += PADDING;
        maxY += PADDING;

        const boxWidth = maxX - minX;
        const boxHeight = maxY - minY;

        // 3. Calculate Scale to Fit into Map Area
        // Maintain Aspect Ratio, fit fully inside
        const scaleX = mapWidth / boxWidth;
        const scaleY = mapHeight / boxHeight;
        const drawScale = Math.min(scaleX, scaleY); // How many CARD pixels per WORLD unit

        // 4. Center the drawing
        // offset inside the map rect
        const drawOffsetX = (mapWidth - (boxWidth * drawScale)) / 2;
        const drawOffsetY = (mapHeight - (boxHeight * drawScale)) / 2;

        // 5. Render FILTERED Pixels
        // Calculate pixel size - ensure minimum visibility
        const pSize = Math.max(20 * drawScale, 0.5); // Minimum 0.5px to ensure visibility

        // For very large pixel counts, use sampling to improve performance
        const shouldSample = purchasedPixels.length > 10000;
        const sampleRate = shouldSample ? Math.ceil(purchasedPixels.length / 5000) : 1;

        console.log(`[ShareCard] Rendering ${purchasedPixels.length} pixels, scale: ${drawScale.toFixed(4)}, pixelSize: ${pSize.toFixed(2)}px, sampling: ${shouldSample ? `1/${sampleRate}` : 'none'}`);

        // Draw Relevant Pixels
        // Draw Relevant Pixels
        let renderedCount = 0;

        // FIX: Iterate purchasedPixels directly to guarantee rendering without waiting for socket
        const pixelsToDraw = purchasedPixels || [];

        pixelsToDraw.forEach(pixel => {
            // Filter: Only draw if within our Viewport Box (Should be always true if minX/maxX calc is correct)
            if (pixel.x >= minX && pixel.x <= maxX && pixel.y >= minY && pixel.y <= maxY) {

                // Apply sampling for performance
                if (shouldSample && renderedCount % sampleRate !== 0) {
                    renderedCount++;
                    return;
                }

                const screenX = mapX + drawOffsetX + (pixel.x - minX) * drawScale;
                const screenY = mapY + drawOffsetY + (pixel.y - minY) * drawScale;

                // Draw Pixel
                ctx.fillStyle = baseColor; // Use passed baseColor as pixels might not have color prop yet
                // Use ceil to prevent gaps, ensure at least 1px
                const effectiveSize = Math.max(1, Math.ceil(pSize));
                ctx.fillRect(screenX, screenY, effectiveSize, effectiveSize);
                renderedCount++;
            }
        });

        console.log(`[ShareCard] Rendered ${renderedCount} pixels on card`);

    } else {
        // Fallback if no specific pixels passed (e.g. initial view?)
        // Just draw what was on canvas
        ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, mapX, mapY, mapWidth, mapHeight);
    }

    // Inner Border
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 4;
    ctx.strokeRect(mapX, mapY, mapWidth, mapHeight);
    ctx.restore();

    // 4. Text Overlay (Refined Layout)
    // 4. Text Overlay (Refined Layout)
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';

    if (i18n.locale === 'en') {
        // --- English Layout ---
        // Line 1: "Extended {Idol}'s Territory"
        ctx.font = 'bold 24px sans-serif'; // Slightly smaller to fit long names
        ctx.fillStyle = '#ffffff';
        ctx.fillText("Extended ", 30, 50);
        const prefixWidth = ctx.measureText("Extended ").width;

        ctx.fillStyle = baseColor;
        ctx.fillText(`${idolName}'s`, 30 + prefixWidth, 50);
        const nameWidth = ctx.measureText(`${idolName}'s`).width;

        ctx.fillStyle = '#ffffff';
        ctx.fillText(" Territory", 30 + prefixWidth + nameWidth, 50);

        // Line 2: "by {Count} Px! 🚩"
        ctx.font = 'bold 36px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText("by ", 30, 88);
        const byWidth = ctx.measureText("by ").width;

        ctx.fillStyle = '#00d4ff'; // Blue highlight
        ctx.fillText(`${pixelCount} Px`, 30 + byWidth, 88);
        const countWidth = ctx.measureText(`${pixelCount} Px`).width;

        ctx.fillStyle = '#ffffff';
        ctx.fillText("! 🚩", 30 + byWidth + countWidth, 88);

    } else {
        // --- Korean Layout (Original) ---
        // Line 1: "{Idol} 의 영토를"
        ctx.font = 'bold 28px sans-serif';
        ctx.fillStyle = baseColor; // Use idol color for name
        ctx.fillText(`${idolName}`, 30, 50);
        const nameWidth = ctx.measureText(`${idolName}`).width;

        ctx.fillStyle = '#ffffff';
        ctx.fillText(`의 영토를`, 30 + nameWidth + 5, 50);

        // Line 2: "{Count} Px 만큼 더 넓혔습니다! 🚩"
        ctx.font = 'bold 36px sans-serif';
        ctx.fillStyle = '#00d4ff'; // Blue highlight
        ctx.fillText(`${pixelCount} Px`, 30, 88);
        const countWidth = ctx.measureText(`${pixelCount} Px`).width;

        ctx.font = 'bold 24px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`만큼 더 넓혔습니다! 🚩`, 30 + countWidth + 10, 85);
    }

    // Footer
    ctx.textAlign = 'right';

    // Brand Name
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('FANDOM PIXEL', width - 20, height - 28);

    // URL (New)
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '12px sans-serif';
    ctx.fillText('www.fandom-pixel.com', width - 20, height - 10);

    // 5. Output
    shareCardImg.src = offCanvas.toDataURL('image/png');
    shareModal.style.display = 'flex';
}

// --- Activity Ticker Logic ---
function showTickerMessage(data) {
    const activityTicker = document.getElementById('activity-ticker');
    if (!activityTicker) {
        console.error("[Ticker] Element #activity-ticker not found!");
        return;
    }

    // Deduplicate or Aggregate? 
    // For now, let's just show raw events but aggregated by batch manually if needed.
    // The server emits 'batch_pixel_update' with an array of pixels.

    // Group by User + Idol to create a summary message
    const summary = {}; // Key: "User:Idol" -> Count

    data.forEach(p => {
        const key = `${p.owner_nickname}:${p.idol_group_name}`;
        if (!summary[key]) summary[key] = 0;
        summary[key]++;
    });

    Object.keys(summary).forEach(key => {
        const [nickname, idolName] = key.split(':');
        const count = summary[key];

        const row = document.createElement('div');
        row.style.background = 'rgba(0, 212, 255, 0.1)';
        row.style.borderLeft = '3px solid #00d4ff';
        row.style.padding = '8px 12px';
        row.style.borderRadius = '4px';
        row.style.color = '#fff';
        row.style.fontSize = '14px';
        row.style.textShadow = '0 1px 2px black';
        row.style.animation = 'slideUpFade 5s forwards';

        // Format: "Just now, [User] claimed [Count] pixels of [Idol]!"
        const user = `<strong>${nickname}</strong>`;
        const idol = `<strong>${idolName}</strong>`;
        const formattedCount = `<strong>${count}</strong>`;

        row.innerHTML = `${i18n.t('messages.ticker_prefix')} ${user}${i18n.t('messages.ticker_claimed')}${idol}${i18n.t('messages.ticker_pixels')}${formattedCount}${i18n.t('messages.ticker_suffix')}`;

        activityTicker.appendChild(row);

        // Remove after animation (5s total: 0.4s slide + 4.1s wait + 0.5s fade)
        setTimeout(() => {
            if (row.parentNode) row.parentNode.removeChild(row);
        }, 5000);
    });
}

// Socket Listeners for Ticker
socket.on('batch_pixel_update', (pixels) => {
    console.log("[Ticker] Received batch update:", pixels.length);
    if (pixels && pixels.length > 0) {
        showTickerMessage(pixels);
    }
});

// Also listen for singular updates (just in case legacy path is used)
socket.on('pixel_update', (data) => {
    console.log("[Ticker] Received single update:", data);
    if (data) {
        showTickerMessage([data]);
    }
});

// Test Trigger on Load (Remove before production if annoying, but good for confirmation)
/*
setTimeout(() => {
    showTickerMessage([{
        owner_nickname: '시스템',
        idol_group_name: 'Fandom Pixel',
        count: 1
    }]);
}, 2000);
*/



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

                tr.innerHTML = `
                    <td style="padding: 10px; font-size: 13px;">${purchased}</td>
                    <td style="padding: 10px;">
                         <span style="color: ${idolInfo[item.idol_group_name]?.color || '#fff'}; font-weight:bold;">${item.idol_group_name}</span>
                    </td>
                    <td style="padding: 10px; font-weight: bold; color: #00d4ff;">${item.count}개</td>
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
                            <div style="font-weight: bold; color: #ffffff; text-shadow: 0 0 5px ${groupInfo.color}80;">${item.name}</div>
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

// --- Notice Modal Tabs ---
document.querySelectorAll('.notice-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // Toggle Active Tab
        document.querySelectorAll('.notice-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Toggle Content
        const targetId = tab.dataset.target;
        document.querySelectorAll('.notice-content').forEach(content => {
            content.style.display = content.id === targetId ? 'block' : 'none';
        });
    });
});

// --- Season Timer Logic ---
function getSeasonInfo() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11

    const seasonIndex = Math.floor(month / 3); // 0-3 (Q1-Q4)
    const seasonNum = seasonIndex + 1;

    // End months: Mar(2), Jun(5), Sep(8), Dec(11)
    const endMonth = (seasonIndex * 3) + 2;

    // Last day of the end month at 23:59:59
    const endDate = new Date(year, endMonth + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    return { seasonNum, endDate };
}

function updateSeasonTimer() {
    const { seasonNum, endDate } = getSeasonInfo();
    const now = new Date();
    const diff = endDate - now;

    const containerEl = document.getElementById('season-timer');
    let timerEl = document.getElementById('season-countdown');

    // Dynamically update Season Number in UI
    if (containerEl) {
        // PRE-SEASON LOGIC: If 2026 Q1, show PRE-SEASON
        let displaySeason = `SEASON ${seasonNum}`;
        if (seasonNum === 1 && now.getFullYear() === 2026) {
            displaySeason = "PRE-SEASON";
        }

        // Check if we need to update the season label (e.g. on load or season change)
        // Use a simple check or just check the first text node? 
        // Safer to just check if innerText starts with the expected string
        const currentText = containerEl.textContent.trim();
        if (!currentText.startsWith(displaySeason)) {
            containerEl.innerHTML = `${displaySeason} <span style="font-size: 0.8em; color: #fff;">ENDS IN</span> <span id="season-countdown" style="font-family: monospace; font-size: 1.2em;">--:--:--:--</span>`;
            timerEl = document.getElementById('season-countdown'); // Re-fetch new element
        }
    }

    if (!timerEl) return;

    if (diff <= 0) {
        timerEl.textContent = "SEASON ENDED";
        timerEl.style.color = "#ff4d4d";
        return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    timerEl.textContent = `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

// Start Timer
setInterval(updateSeasonTimer, 1000);
updateSeasonTimer(); // Initial call

// --- Mobile Swipe-to-Close for Side Panel ---
let panelStartY = 0;
let isPanelDragging = false;

sidePanel.addEventListener('touchstart', (e) => {
    if (window.innerWidth > 768) return; // Only apply on mobile where it acts as bottom sheet
    // Only facilitate drag if at top of scroll
    if (sidePanel.scrollTop > 5) return; // Tolerance of 5px

    // We don't prevent default here to allow click events to pass through if it's a tap
    panelStartY = e.touches[0].clientY;
    isPanelDragging = false;
    sidePanel.style.transition = 'none'; // Disable transition during drag
}, { passive: true });

sidePanel.addEventListener('touchmove', (e) => {
    if (window.innerWidth > 768) return;

    // Check constraints again in case scroll changed
    // Use a slightly larger tolerance to latch onto drag mode
    if (sidePanel.scrollTop > 5 && !isPanelDragging) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - panelStartY;

    if (deltaY > 0) { // Dragging Down
        // Check if we started dragging or if we are already dragging
        // We only want to intercept if we are pulling DOWN from the TOP.
        // If the user was scrolling UP and hit top, then pulls down, that is valid.

        if (e.cancelable) e.preventDefault(); // Prevent native scroll (overscroll behavior)
        isPanelDragging = true;
        sidePanel.style.transform = `translateY(${deltaY}px)`;
    }
}, { passive: false });

sidePanel.addEventListener('touchend', (e) => {
    if (window.innerWidth > 768) return;
    if (!isPanelDragging) {
        // Clean up any potential transform if it was a tiny jiggle
        sidePanel.style.transform = '';
        return;
    }

    const currentY = e.changedTouches[0].clientY;
    const deltaY = currentY - panelStartY;
    const threshold = 100; // Threshold to close

    sidePanel.style.transition = 'transform 0.3s ease-out'; // Re-enable transition for snap

    if (deltaY > threshold) {
        // CLOSE ACTION
        sidePanel.style.transform = `translateY(100%)`; // Slide out completely

        // Wait for animation then reset state
        setTimeout(() => {
            selectedPixels = []; // Clear selection
            sidePanel.style.display = 'none';
            sidePanel.style.transform = ''; // Reset css transform for next open
            draw(); // Redraw canvas to remove highlighting
        }, 300);
    } else {
        // SNAP BACK
        sidePanel.style.transform = `translateY(0)`;
    }
    isPanelDragging = false;
});
