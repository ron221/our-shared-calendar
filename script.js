// 除錯資訊
console.log('🐱🐭 共享日曆 JavaScript 載入成功！');

// Firebase 配置 - 真實配置
const firebaseConfig = {
    apiKey: "AIzaSyBxLquFyao1ujsj_7utW-0r_A1ZgsenaI4",
    authDomain: "our-shared-calendar-f16ce.firebaseapp.com",
    databaseURL: "https://our-shared-calendar-f16ce-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "our-shared-calendar-f16ce",
    storageBucket: "our-shared-calendar-f16ce.firebasestorage.app",
    messagingSenderId: "729942793891",
    appId: "1:729942793891:web:88366bff70b150682fe916"
};

// 全域變數
let currentDate = new Date();
let currentUser = 'cat'; // 預設為貓咪模式
let currentView = 'month'; // 預設為月視圖
let events = [];
let selectedDate = null;
let editingEventId = null;
let sidebarDate = null; // 記住側邊欄當前顯示的日期
let taiwanHolidays = {};
let isDarkMode = false;

// 台灣國定假日資料
function initializeTaiwanHolidays() {
    const currentYear = new Date().getFullYear();

    // 2024年台灣國定假日
    const holidays2024 = {
        '2024-01-01': '元旦',
        '2024-02-08': '農曆除夕',
        '2024-02-09': '農曆春節',
        '2024-02-10': '農曆春節',
        '2024-02-11': '農曆春節',
        '2024-02-12': '農曆春節',
        '2024-02-13': '農曆春節',
        '2024-02-14': '農曆春節',
        '2024-02-28': '和平紀念日',
        '2024-04-04': '兒童節',
        '2024-04-05': '清明節',
        '2024-05-01': '勞動節',
        '2024-06-10': '端午節',
        '2024-09-17': '中秋節',
        '2024-10-10': '國慶日',
        '2024-12-25': '行憲紀念日'
    };

    // 2025年台灣國定假日
    const holidays2025 = {
        '2025-01-01': '元旦',
        '2025-01-28': '農曆除夕',
        '2025-01-29': '農曆春節',
        '2025-01-30': '農曆春節',
        '2025-01-31': '農曆春節',
        '2025-02-01': '農曆春節',
        '2025-02-03': '農曆春節',
        '2025-02-28': '和平紀念日',
        '2025-04-04': '兒童節',
        '2025-04-05': '清明節',
        '2025-05-01': '勞動節',
        '2025-05-31': '端午節',
        '2025-10-06': '中秋節',
        '2025-10-10': '國慶日',
        '2025-12-25': '行憲紀念日'
    };

    // 合併假日資料
    taiwanHolidays = { ...holidays2024, ...holidays2025 };
}

// 檢查是否為台灣國定假日
function getTaiwanHoliday(date) {
    const dateStr = formatDate(date);
    return taiwanHolidays[dateStr] || null;
}

// 深色模式切換功能
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    const body = document.body;
    const themeIcon = document.querySelector('.theme-icon');

    if (isDarkMode) {
        body.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '☀️';
        localStorage.setItem('darkMode', 'true');
    } else {
        body.removeAttribute('data-theme');
        themeIcon.textContent = '🌙';
        localStorage.setItem('darkMode', 'false');
    }
}

// 初始化深色模式設定
function initializeDarkMode() {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
        isDarkMode = true;
        document.body.setAttribute('data-theme', 'dark');
        document.querySelector('.theme-icon').textContent = '☀️';
    }
}

// 拖拽相關變數
let draggedEvent = null;
let draggedElement = null;
let isDragging = false;

// 觸控滑動相關變數
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let isSwiping = false;

// Firebase 相關變數
let database = null;
let isFirebaseEnabled = false;
let syncStatus = 'connecting';

// Google Calendar API 相關變數
let isGoogleCalendarEnabled = false;
let googleCalendarAuth = null;
let googleCalendarStatus = 'disconnected';
let lastGoogleCalendarSync = null;
let isGoogleApiReady = false;
let tokenClient = null;

// Google Calendar API 配置將從 google-config.js 載入

// Telegram 通知相關變數
let isTelegramEnabled = false;
let telegramConfig = null;

// 月份名稱
const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
];

// DOM 元素
const calendarGrid = document.getElementById('calendar');
const currentPeriodElement = document.getElementById('currentPeriod');
const calendarWrapper = document.querySelector('.calendar-wrapper');
const eventModal = document.getElementById('eventModal');
const eventForm = document.getElementById('eventForm');
const eventSidebar = document.getElementById('eventSidebar');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM 載入完成，開始初始化...');

    try {
        initializeTaiwanHolidays();
        initializeDarkMode();
        initializeFirebase();
        initializeGoogleCalendar();
        initializeTelegram();
        setupEventListeners();
        console.log('✅ 日曆初始化完成！');
    } catch (error) {
        console.error('❌ 初始化錯誤:', error);
        // 如果 Firebase 失敗，回退到本地模式
        fallbackToLocalMode();
    }
});

// 設置事件監聽器
function setupEventListeners() {
    // 用戶模式切換
    document.getElementById('catMode').addEventListener('click', () => switchUser('cat'));
    document.getElementById('mouseMode').addEventListener('click', () => switchUser('mouse'));

    // 視圖切換
    document.getElementById('monthView').addEventListener('click', () => switchView('month'));
    document.getElementById('weekView').addEventListener('click', () => switchView('week'));

    // 期間導航
    document.getElementById('prevPeriod').addEventListener('click', () => {
        if (currentView === 'month') {
            currentDate.setMonth(currentDate.getMonth() - 1);
        } else {
            currentDate.setDate(currentDate.getDate() - 7);
        }
        renderCalendar();
    });

    document.getElementById('nextPeriod').addEventListener('click', () => {
        if (currentView === 'month') {
            currentDate.setMonth(currentDate.getMonth() + 1);
        } else {
            currentDate.setDate(currentDate.getDate() + 7);
        }
        renderCalendar();
    });

    // 彈窗控制
    document.querySelector('.close').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('deleteBtn').addEventListener('click', deleteEvent);

    // 表單提交
    eventForm.addEventListener('submit', handleFormSubmit);

    // 手機版新增按鈕
    document.getElementById('mobileAddBtn').addEventListener('click', () => {
        // 如果沒有選中日期，預設為今天
        if (!selectedDate) {
            selectedDate = new Date();
        }
        openEventModal();
    });

    // 深色模式切換按鈕
    document.getElementById('themeToggle').addEventListener('click', toggleDarkMode);

    // 側邊欄控制
    document.getElementById('closeSidebar').addEventListener('click', closeSidebar);
    document.getElementById('addEventToDate').addEventListener('click', addEventToSelectedDate);

    // 設置觸控滑動手勢
    setupSwipeGestures();

    // Google Calendar 按鈕事件
    document.getElementById('connectGoogleCalendar').addEventListener('click', connectGoogleCalendar);
    document.getElementById('syncGoogleCalendar').addEventListener('click', syncFromGoogleCalendar);
    document.getElementById('disconnectGoogleCalendar').addEventListener('click', disconnectGoogleCalendar);

    // 點擊彈窗外部關閉
    window.addEventListener('click', (e) => {
        if (e.target === eventModal) {
            closeModal();
        }
    });
}

// 初始化 Firebase
function initializeFirebase() {
    try {
        // 嘗試初始化 Firebase（使用模擬配置，實際部署時需要真實配置）
        if (typeof firebase !== 'undefined') {
            firebase.initializeApp(firebaseConfig);
            database = firebase.database();
            setupFirebaseListeners();
            updateSyncStatus('connected', '雲端已連線');
            isFirebaseEnabled = true;
            console.log('🔥 Firebase 初始化成功');
        } else {
            throw new Error('Firebase SDK 未載入');
        }
    } catch (error) {
        console.warn('⚠️ Firebase 初始化失敗，使用本地模式:', error);
        fallbackToLocalMode();
    }
}

// 回退到本地模式
function fallbackToLocalMode() {
    isFirebaseEnabled = false;
    updateSyncStatus('disconnected', '離線模式');

    // 從本地儲存載入資料
    events = JSON.parse(localStorage.getItem('calendarEvents')) || [];

    renderCalendar();
    console.log('📱 使用本地模式，載入', events.length, '個本地行程');
}

// 初始化示例事件（保留供手動測試使用）
// 如需要測試資料，可在 Console 中執行：initializeSampleEvents()
function initializeSampleEvents() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    events = [
        {
            id: generateId(),
            title: '貓咪的午睡時間',
            date: formatDate(today),
            time: '14:00',
            description: '在陽光下舒服地睡覺 😴',
            type: 'personal',
            owner: 'cat',
            status: 'confirmed'
        },
        {
            id: generateId(),
            title: '老鼠的起司時光',
            date: formatDate(today),
            time: '16:00',
            description: '品嚐美味的起司 🧀',
            type: 'personal',
            owner: 'mouse',
            status: 'confirmed'
        },
        {
            id: generateId(),
            title: '一起看電影',
            date: formatDate(tomorrow),
            time: '20:00',
            description: '看一部浪漫的電影 🎬',
            type: 'shared',
            owner: 'cat',
            status: 'confirmed'
        },
        {
            id: generateId(),
            title: '公園散步',
            date: formatDate(nextWeek),
            time: '10:00',
            description: '在公園裡享受美好時光 🌳',
            type: 'invitation',
            owner: 'mouse',
            status: 'pending'
        },
        {
            id: generateId(),
            title: '韓國旅行',
            date: formatDate(new Date(today.getFullYear(), today.getMonth() + 1, 25)),
            endDate: formatDate(new Date(today.getFullYear(), today.getMonth() + 1, 30)),
            time: '',
            description: '一起去韓國玩！首爾 + 釜山 🇰🇷',
            type: 'shared',
            owner: 'cat',
            status: 'confirmed',
            isMultiDay: true
        }
    ];
    saveEvents();
    console.log('🎭 已重新載入示例資料');
}

// 設置 Firebase 監聽器
function setupFirebaseListeners() {
    if (!database) return;

    const eventsRef = database.ref('events');

    // 監聽資料變化
    eventsRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data && Array.isArray(data)) {
            events = data;
            renderCalendar();
            console.log('🔄 從雲端同步資料:', events.length, '個行程');
        } else {
            // 如果雲端沒有資料，設為空陣列
            events = [];
            renderCalendar();
            console.log('📋 雲端資料為空，顯示空日曆');
        }
    });

    // 監聽連線狀態
    database.ref('.info/connected').on('value', (snapshot) => {
        if (snapshot.val() === true) {
            updateSyncStatus('connected', '雲端已連線');
        } else {
            updateSyncStatus('disconnected', '連線中斷');
        }
    });
}

// 同步到 Firebase
function syncToFirebase() {
    if (!database || !isFirebaseEnabled) return;

    updateSyncStatus('syncing', '同步中...');

    // 清理事件資料，確保沒有 undefined 值
    const cleanedEvents = events.map(event => ({
        ...event,
        endDate: event.endDate === undefined ? null : event.endDate
    }));

    // 檢查是否還有 undefined 值
    const hasUndefinedValues = cleanedEvents.some(event =>
        Object.values(event).some(value => value === undefined)
    );

    if (hasUndefinedValues) {
        console.error('❌ 事件資料仍包含 undefined 值:', cleanedEvents);
    }

    database.ref('events').set(cleanedEvents)
        .then(() => {
            updateSyncStatus('connected', '雲端已連線');
            console.log('☁️ 資料已同步到雲端');
        })
        .catch((error) => {
            console.error('❌ 同步失敗:', error);
            updateSyncStatus('disconnected', '同步失敗');
        });
}

// 更新同步狀態
function updateSyncStatus(status, text) {
    syncStatus = status;
    const statusElement = document.getElementById('syncStatus');
    const textElement = document.getElementById('syncText');
    const iconElement = document.getElementById('syncIcon');

    if (statusElement && textElement && iconElement) {
        // 移除所有狀態類別
        statusElement.classList.remove('connected', 'disconnected', 'syncing');
        statusElement.classList.add(status);

        textElement.textContent = text;

        // 更新圖標
        switch (status) {
            case 'connected':
                iconElement.className = 'fas fa-cloud-upload-alt';
                break;
            case 'disconnected':
                iconElement.className = 'fas fa-cloud-slash';
                break;
            case 'syncing':
                iconElement.className = 'fas fa-sync-alt';
                break;
            default:
                iconElement.className = 'fas fa-wifi';
        }
    }
}

// 切換用戶模式
function switchUser(user) {
    currentUser = user;

    // 除錯資訊
    console.log('👤 切換用戶模式:', currentUser);

    // 更新按鈕狀態
    document.querySelectorAll('.user-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-user="${user}"]`).classList.add('active');

    // 重新渲染日曆
    renderCalendar();
}

// 切換視圖模式
function switchView(view) {
    currentView = view;

    // 更新按鈕狀態
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');

    // 更新日曆容器的CSS類
    calendarWrapper.className = `calendar-wrapper ${view}-view`;

    // 重新渲染日曆
    renderCalendar();
}

// 渲染日曆
function renderCalendar() {
    if (currentView === 'month') {
        renderMonthView();
    } else {
        renderWeekView();
    }
}

// 渲染月視圖
function renderMonthView() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // 更新標題
    currentPeriodElement.textContent = `${year}年 ${monthNames[month]}`;

    // 清空日曆網格
    calendarGrid.innerHTML = '';

    // 獲取月份第一天和最後一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // 生成42個日期格子（6週 x 7天）
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        const dayElement = createDayElement(date, month);
        calendarGrid.appendChild(dayElement);
    }
}

// 渲染週視圖
function renderWeekView() {
    const startOfWeek = getStartOfWeek(currentDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // 更新標題
    const startMonth = monthNames[startOfWeek.getMonth()];
    const endMonth = monthNames[endOfWeek.getMonth()];
    const startYear = startOfWeek.getFullYear();
    const endYear = endOfWeek.getFullYear();

    let titleText;
    if (startYear === endYear && startMonth === endMonth) {
        titleText = `${startYear}年 ${startMonth} ${startOfWeek.getDate()}-${endOfWeek.getDate()}日`;
    } else if (startYear === endYear) {
        titleText = `${startYear}年 ${startMonth}${startOfWeek.getDate()}日 - ${endMonth}${endOfWeek.getDate()}日`;
    } else {
        titleText = `${startYear}年${startMonth}${startOfWeek.getDate()}日 - ${endYear}年${endMonth}${endOfWeek.getDate()}日`;
    }

    currentPeriodElement.textContent = titleText;

    // 清空日曆網格
    calendarGrid.innerHTML = '';

    // 生成7個日期格子
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);

        const dayElement = createDayElement(date, date.getMonth());
        calendarGrid.appendChild(dayElement);
    }
}

// 獲取週的開始日期（星期日）
function getStartOfWeek(date) {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    return startOfWeek;
}

// 創建日期元素
function createDayElement(date, currentMonth) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';

    // 檢查是否為其他月份
    if (date.getMonth() !== currentMonth) {
        dayElement.classList.add('other-month');
    }

    // 檢查是否為今天
    const today = new Date();
    if (isSameDate(date, today)) {
        dayElement.classList.add('today');
    }

    // 添加日期數字
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';

    // 在週視圖的手機版本中顯示更詳細的日期資訊
    const isMobile = window.innerWidth <= 768;
    if (currentView === 'week' && isMobile) {
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        const weekday = weekdays[date.getDay()];
        dayNumber.innerHTML = `${weekday}<br/>${date.getDate()}`;
    } else {
        dayNumber.textContent = date.getDate();
    }

    dayElement.appendChild(dayNumber);

    // 檢查並顯示國定假日
    const holiday = getTaiwanHoliday(date);
    if (holiday) {
        const holidayElement = document.createElement('div');
        holidayElement.className = 'holiday-name';
        holidayElement.textContent = holiday;
        dayElement.appendChild(holidayElement);
        dayElement.classList.add('holiday');
    }

    // 添加事件列表
    const eventsContainer = createDayEventsContainer(date);
    dayElement.appendChild(eventsContainer);

    // 添加點擊事件
    dayElement.addEventListener('click', () => {
        selectedDate = new Date(date);
        showDayEvents(date);
    });

        // 雙擊添加事件
    dayElement.addEventListener('dblclick', () => {
        selectedDate = new Date(date);
        console.log('📅 雙擊日期:', {
            clickedDate: date.toDateString(),
            selectedDate: selectedDate.toDateString(),
            formattedDate: formatDate(selectedDate)
        });
        openEventModal();
    });

    // 拖拽支援
    setupDragAndDrop(dayElement, date);

    return dayElement;
}

// 創建日期中的事件容器
function createDayEventsContainer(date) {
    const container = document.createElement('div');
    container.className = 'day-events';

        const dayEvents = getEventsForDate(date);

    // 根據螢幕大小和視圖調整顯示的事件數量
    let maxEvents;
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;

    if (currentView === 'week') {
        // 週視圖可以顯示更多
        maxEvents = isMobile ? (isSmallMobile ? 4 : 5) : 6;
    } else {
        // 月視圖限制較少
        maxEvents = isMobile ? (isSmallMobile ? 3 : 4) : 3;
    }

    const eventsToShow = dayEvents.slice(0, maxEvents);

        if (eventsToShow.length === 0) {
        // 如果沒有行程，在週視圖手機版顯示提示
        const isMobile = window.innerWidth <= 768;
        if (currentView === 'week' && isMobile) {
            const emptyItem = document.createElement('div');
            emptyItem.className = 'day-event-item empty-day';
            emptyItem.textContent = '無行程';
            emptyItem.style.cssText = `
                background: rgba(200, 200, 200, 0.1);
                border-left-color: #ccc;
                color: #999;
                font-style: italic;
                text-align: center;
            `;
            container.appendChild(emptyItem);
        }
    } else {
        eventsToShow.forEach(event => {
            const eventItem = createDayEventItem(event);
            container.appendChild(eventItem);
        });

        // 如果有更多事件，顯示 "+N more" 提示
        if (dayEvents.length > maxEvents) {
            const moreItem = document.createElement('div');
            moreItem.className = 'day-event-item more-events';
            moreItem.textContent = `+${dayEvents.length - maxEvents} 更多`;
            moreItem.style.cssText = `
                background: rgba(102, 126, 234, 0.1);
                border-left-color: #667eea;
                font-weight: 600;
                text-align: center;
            `;
            container.appendChild(moreItem);
        }
    }

    return container;
}

// 創建日期中的單個事件項目
function createDayEventItem(event, currentDate = null) {
    const item = document.createElement('div');
    item.className = `day-event-item ${getEventClass(event)}`;

    // 如果是多日行程，添加特殊樣式
    if (event.isMultiDay || event.endDate) {
        item.classList.add('multi-day-event');
    }

            // 創建時間和標題的顯示
    let displayText = '';

    // 檢查是否為手機螢幕
    const isMobile = window.innerWidth <= 768;

    // 根據行程類型和擁有者添加圖標
    let ownerIcon = '';
    if (event.isFromGoogleCalendar) {
        ownerIcon = '🔗 '; // Google Calendar 使用連結圖標
    } else if (event.isSharedFromGoogle) {
        const originalOwnerIcon = event.originalOwner === 'cat' ? '🐱' : '🐭';
        ownerIcon = `${originalOwnerIcon}🔗 `; // 分享的 Google Calendar 事件
    } else if (event.type === 'shared') {
        ownerIcon = '🤝 '; // 共同行程使用握手圖標
    } else if (event.status === 'pending') {
        ownerIcon = event.owner === 'cat' ? '🐱📩 ' : '🐭📩 '; // 待確認邀請
    } else if (event.owner === 'cat') {
        ownerIcon = '🐱 ';
    } else if (event.owner === 'mouse') {
        ownerIcon = '🐭 ';
    }

    if (event.isMultiDay || event.endDate) {
        // 多日行程的顯示
        const startDate = new Date(event.date);
        const endDate = new Date(event.endDate);

        if (isMobile) {
            // 手機版：簡化顯示
            const start = `${startDate.getMonth() + 1}/${startDate.getDate()}`;
            const end = `${endDate.getMonth() + 1}/${endDate.getDate()}`;
            displayText = `${ownerIcon}📅${event.title} (${start}-${end})`;
        } else {
            // 桌面版：完整顯示
            const start = `${startDate.getMonth() + 1}/${startDate.getDate()}`;
            const end = `${endDate.getMonth() + 1}/${endDate.getDate()}`;
            displayText = `${ownerIcon}📅 ${event.title} (${start}-${end})`;
        }
    } else {
        // 單日行程的顯示
        if (event.time) {
            if (isMobile) {
                // 手機版：縮短時間格式
                const shortTime = event.time.substring(0, 5); // 去掉秒數
                displayText = `${ownerIcon}${shortTime} ${event.title}`;
            } else {
                displayText = `${ownerIcon}${event.time} ${event.title}`;
            }
        } else {
            displayText = `${ownerIcon}${event.title}`;
        }
    }

    item.textContent = displayText;
    item.title = `${event.title}${event.description ? '\n' + event.description : ''}${
        event.isMultiDay || event.endDate ? '\n多日行程: ' + event.date + ' ~ ' + event.endDate : ''
    }`;

    // 如果是自己的行程或共同行程，允許拖拽（但多日行程暫時不允許拖拽）
    if ((event.owner === currentUser || event.type === 'shared') && !event.isMultiDay && !event.endDate) {
        item.draggable = true;
        item.dataset.eventId = event.id;
        setupEventDragHandlers(item, event);
    }

    // 點擊事件項目直接編輯
    item.addEventListener('click', (e) => {
        if (isDragging) return; // 拖拽時不觸發點擊
        e.stopPropagation();
        if (event.isFromGoogleCalendar) {
            // Google Calendar 事件顯示分享選項
            showGoogleEventActions(event);
        } else if (event.owner === currentUser || event.type === 'shared') {
            editEvent(event);
        } else {
            // 如果是別人的事件，顯示詳情
            showEventDetails(event);
        }
    });

    return item;
}

// 顯示 Google Calendar 事件的操作選項
function showGoogleEventActions(event) {
    // 檢查是否已經分享過這個事件
    const isAlreadyShared = events.some(e =>
        e.googleEventId === event.googleEventId &&
        e.isSharedFromGoogle === true &&
        !e.isFromGoogleCalendar
    );

    const modal = document.getElementById('eventModal');
    const form = document.getElementById('eventForm');

    // 設置標題
    document.getElementById('modalTitle').textContent = 'Google Calendar 行程';

    // 填充表單但設為只讀
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventDate').value = event.date;
    document.getElementById('eventEndDate').value = event.endDate || '';
    document.getElementById('eventTime').value = event.time || '';
    document.getElementById('eventDescription').value = event.description || '';
    document.getElementById('eventType').value = event.type;

    // 設置所有輸入為只讀
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.disabled = true;
    });

    // 隱藏原有的操作按鈕
    document.getElementById('deleteBtn').style.display = 'none';
    document.querySelector('.btn-primary').style.display = 'none';

    // 創建 Google 事件專用的操作按鈕區域
    let googleActionsDiv = document.getElementById('googleEventActions');
    if (!googleActionsDiv) {
        googleActionsDiv = document.createElement('div');
        googleActionsDiv.id = 'googleEventActions';
        googleActionsDiv.className = 'google-event-actions';
        googleActionsDiv.style.cssText = `
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #eee;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        `;
        form.appendChild(googleActionsDiv);
    }

    // 清空之前的按鈕
    googleActionsDiv.innerHTML = '';

    // 分享/取消分享按鈕
    const shareBtn = document.createElement('button');
    shareBtn.type = 'button';
    shareBtn.className = isAlreadyShared ? 'btn btn-warning' : 'btn btn-success';
    shareBtn.innerHTML = isAlreadyShared ?
        '<i class="fas fa-user-minus"></i> 取消分享' :
        '<i class="fas fa-share"></i> 分享給對方';
    shareBtn.style.cssText = 'flex: 1; min-width: 120px;';

    shareBtn.addEventListener('click', () => {
        if (isAlreadyShared) {
            unshareGoogleEvent(event);
        } else {
            shareGoogleEvent(event);
        }
        closeModal();
    });

    // 關閉按鈕
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn btn-secondary';
    closeBtn.innerHTML = '<i class="fas fa-times"></i> 關閉';
    closeBtn.style.cssText = 'min-width: 80px;';
    closeBtn.addEventListener('click', closeModal);

    googleActionsDiv.appendChild(shareBtn);
    googleActionsDiv.appendChild(closeBtn);

    // 防止背景滾動
    document.body.style.overflow = 'hidden';
    modal.style.display = 'block';

    // 確保彈窗滾動到頂部
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.scrollTop = 0;
    }
}

// 顯示事件詳情（只讀）
function showEventDetails(event) {
    const modal = document.getElementById('eventModal');
    const form = document.getElementById('eventForm');

    // 填充表單但設為只讀
    document.getElementById('modalTitle').textContent = '行程詳情';
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventDate').value = event.date;
    document.getElementById('eventTime').value = event.time || '';
    document.getElementById('eventDescription').value = event.description || '';
    document.getElementById('eventType').value = event.type;

    // 設置所有輸入為只讀
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.disabled = true;
    });

    // 隱藏操作按鈕，只顯示關閉按鈕
    document.getElementById('deleteBtn').style.display = 'none';
    document.querySelector('.btn-primary').style.display = 'none';
    document.getElementById('cancelBtn').textContent = '關閉';

    // 防止背景滾動
    document.body.style.overflow = 'hidden';
    modal.style.display = 'block';

    // 確保彈窗滾動到頂部
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.scrollTop = 0;
    }

    // 當關閉時恢復表單狀態
    const originalCloseModal = closeModal;
    window.closeModal = function() {
        inputs.forEach(input => {
            input.disabled = false;
        });
        document.querySelector('.btn-primary').style.display = 'inline-block';
        document.getElementById('cancelBtn').textContent = '取消';
        originalCloseModal();
        window.closeModal = originalCloseModal;
    };
}

// 獲取特定日期的事件
function getEventsForDate(date) {
    const dateString = formatDate(date);
    return events.filter(event => {
        // 單日行程：直接比較日期
        if (!event.endDate || event.date === event.endDate) {
            return event.date === dateString;
        }

        // 多日行程：檢查日期是否在範圍內
        const startDate = new Date(event.date);
        const endDate = new Date(event.endDate);
        const checkDate = new Date(dateString);

        return checkDate >= startDate && checkDate <= endDate;
    });
}

// 獲取事件CSS類別
function getEventClass(event) {
    // 除錯資訊
    console.log('🎨 決定事件顏色:', {
        title: event.title,
        owner: event.owner,
        type: event.type,
        status: event.status,
        isFromGoogleCalendar: event.isFromGoogleCalendar,
        isSharedFromGoogle: event.isSharedFromGoogle
    });

    if (event.isFromGoogleCalendar) return 'google-event';
    if (event.isSharedFromGoogle) return 'shared-event'; // 分享的 Google 事件顯示為共享事件
    if (event.type === 'shared') return 'shared-event';
    if (event.status === 'pending') return 'pending-event';
    if (event.owner === 'cat') return 'cat-event';
    if (event.owner === 'mouse') return 'mouse-event';
    return 'personal-event';
}

// 顯示某天的事件
function showDayEvents(date) {
    // 更新選中的日期和側邊欄日期為當前查看的日期
    selectedDate = new Date(date);
    sidebarDate = new Date(date);

    const dayEvents = getEventsForDate(date);
    const eventList = document.getElementById('eventList');

    // 更新側邊欄標題
    document.querySelector('.sidebar-header h3').textContent =
        `${date.getMonth() + 1}月${date.getDate()}日 行程`;

    // 清空事件列表
    eventList.innerHTML = '';

    if (dayEvents.length === 0) {
        eventList.innerHTML = '<p style="text-align: center; color: #666;">這天沒有行程</p>';
    } else {
        dayEvents.forEach(event => {
            const eventItem = createEventListItem(event);
            eventList.appendChild(eventItem);
        });
    }

    // 顯示側邊欄
    eventSidebar.classList.add('open');

    console.log('📅 顯示日期詳情:', {
        viewDate: date.toDateString(),
        selectedDate: selectedDate.toDateString(),
        sidebarDate: sidebarDate.toDateString(),
        eventsCount: dayEvents.length
    });
}

// 創建事件列表項目
function createEventListItem(event) {
    const container = document.createElement('div');
    container.className = 'event-item-container';

    const item = document.createElement('div');
    item.className = 'event-item';

    const title = document.createElement('div');
    title.className = 'event-title';

    // 添加行程類型和擁有者圖標
    let ownerIcon = '';
    if (event.isFromGoogleCalendar) {
        ownerIcon = '🔗 '; // Google Calendar 使用連結圖標
    } else if (event.isSharedFromGoogle) {
        const originalOwnerIcon = event.originalOwner === 'cat' ? '🐱' : '🐭';
        ownerIcon = `${originalOwnerIcon}🔗 `; // 分享的 Google Calendar 事件
    } else if (event.type === 'shared') {
        ownerIcon = '🤝 '; // 共同行程使用握手圖標
    } else if (event.status === 'pending') {
        ownerIcon = event.owner === 'cat' ? '🐱📩 ' : '🐭📩 '; // 待確認邀請
    } else if (event.owner === 'cat') {
        ownerIcon = '🐱 ';
    } else if (event.owner === 'mouse') {
        ownerIcon = '🐭 ';
    }

    title.textContent = `${ownerIcon}${event.title}`;

    const time = document.createElement('div');
    time.className = 'event-time';
    time.textContent = event.time ? `${event.time} - ${getEventTypeText(event)}` : getEventTypeText(event);

    const description = document.createElement('div');
    description.className = 'event-description';
    description.textContent = event.description || '';

    item.appendChild(title);
    item.appendChild(time);
    if (event.description) {
        item.appendChild(description);
    }

    // 如果是待確認的邀請，添加確認/拒絕按鈕
    if (event.status === 'pending' && event.owner !== currentUser) {
        const actions = createEventActions(event);
        item.appendChild(actions);
    }

    // 創建刪除按鈕 (只有當用戶有權限刪除時才顯示)
    const canDelete = !event.isFromGoogleCalendar && (event.owner === currentUser || event.type === 'shared');
    let deleteBtn = null;

    if (canDelete) {
        deleteBtn = document.createElement('div');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showDeleteConfirmation(event);
        });
        container.appendChild(deleteBtn);
    }

    container.appendChild(item);

    // 添加左滑功能
    if (canDelete && deleteBtn) {
        addSwipeToDeleteGesture(container, item, deleteBtn);
    }

    // 點擊編輯事件
    item.addEventListener('click', () => {
        if (event.isFromGoogleCalendar) {
            // Google Calendar 事件顯示分享選項
            showGoogleEventActions(event);
        } else if (event.owner === currentUser || event.type === 'shared') {
            editEvent(event);
        }
    });

    return container;
}

// 創建事件操作按鈕
function createEventActions(event) {
    const actions = document.createElement('div');
    actions.className = 'event-actions';

    const acceptBtn = document.createElement('button');
    acceptBtn.className = 'action-btn accept-btn';
    acceptBtn.textContent = '確認';
    acceptBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        acceptInvitation(event.id);
    });

    const rejectBtn = document.createElement('button');
    rejectBtn.className = 'action-btn reject-btn';
    rejectBtn.textContent = '拒絕';
    rejectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        rejectInvitation(event.id);
    });

    actions.appendChild(acceptBtn);
    actions.appendChild(rejectBtn);

    return actions;
}

// 獲取事件類型文字
function getEventTypeText(event) {
    if (event.isFromGoogleCalendar) {
        return '🔗 Google Calendar';
    }
    if (event.isSharedFromGoogle) {
        const originalOwnerText = event.originalOwner === 'cat' ? '🐱' : '🐭';
        return `${originalOwnerText}🔗 分享的 Google Calendar`;
    }

    const ownerText = event.owner === 'cat' ? '🐱' : '🐭';
    switch (event.type) {
        case 'shared': return '🤝 共同行程';
        case 'invitation': return `📩 ${ownerText} 的邀請`;
        default: return `${ownerText} 個人行程`;
    }
}

// 添加左滑刪除手勢
function addSwipeToDeleteGesture(container, item, deleteBtn) {
    let startX = 0;
    let currentX = 0;
    let isSwipeActive = false;
    let swipeThreshold = 80; // 左滑多少像素顯示刪除按鈕

    function handleTouchStart(e) {
        startX = e.touches[0].clientX;
        isSwipeActive = false;
        item.style.transition = 'none';
    }

    function handleTouchMove(e) {
        if (!startX) return;

        currentX = e.touches[0].clientX;
        const diffX = startX - currentX;

        // 只處理左滑
        if (diffX > 0) {
            isSwipeActive = true;
            const translateX = Math.min(diffX, swipeThreshold);
            item.style.transform = `translateX(-${translateX}px)`;

            // 當滑動距離超過閾值時，顯示刪除按鈕
            if (diffX >= swipeThreshold) {
                deleteBtn.style.opacity = '1';
                deleteBtn.style.transform = 'translateX(0)';
            } else {
                const opacity = diffX / swipeThreshold;
                deleteBtn.style.opacity = opacity;
                deleteBtn.style.transform = `translateX(${swipeThreshold - diffX}px)`;
            }
        }
    }

    function handleTouchEnd(e) {
        if (!isSwipeActive) {
            startX = 0;
            return;
        }

        item.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

        const diffX = startX - currentX;

        if (diffX >= swipeThreshold) {
            // 保持顯示刪除按鈕
            item.style.transform = `translateX(-${swipeThreshold}px)`;
            deleteBtn.style.opacity = '1';
            deleteBtn.style.transform = 'translateX(0)';
            container.classList.add('swipe-active');
        } else {
            // 回彈到原位
            resetSwipeState();
        }

        startX = 0;
        isSwipeActive = false;
    }

    function resetSwipeState() {
        item.style.transform = 'translateX(0)';
        deleteBtn.style.opacity = '0';
        deleteBtn.style.transform = `translateX(${swipeThreshold}px)`;
        container.classList.remove('swipe-active');
    }

    // 點擊其他地方時重置狀態
    function handleDocumentClick(e) {
        if (!container.contains(e.target)) {
            resetSwipeState();
        }
    }

    item.addEventListener('touchstart', handleTouchStart, { passive: true });
    item.addEventListener('touchmove', handleTouchMove, { passive: false });
    item.addEventListener('touchend', handleTouchEnd, { passive: true });

    // 監聽文檔點擊事件來重置狀態
    document.addEventListener('click', handleDocumentClick);

    // 清理函數
    container.addEventListener('remove', () => {
        document.removeEventListener('click', handleDocumentClick);
    });
}

// 顯示刪除確認彈窗
function showDeleteConfirmation(event) {
    const modal = document.createElement('div');
    modal.className = 'delete-confirmation-modal';
    modal.innerHTML = `
        <div class="delete-confirmation-content">
            <div class="delete-confirmation-header">
                <h3>確認刪除</h3>
            </div>
            <div class="delete-confirmation-body">
                <p>確定要刪除這個行程嗎？</p>
                <div class="event-preview">
                    <div class="event-preview-title">${event.title}</div>
                    <div class="event-preview-time">${event.time || '全天'}</div>
                    ${event.description ? `<div class="event-preview-desc">${event.description}</div>` : ''}
                </div>
                <p class="delete-warning">此操作無法復原。</p>
            </div>
            <div class="delete-confirmation-actions">
                <button class="btn btn-secondary cancel-delete">取消</button>
                <button class="btn btn-danger confirm-delete">確認刪除</button>
            </div>
        </div>
    `;

    // 添加事件監聽器
    const cancelBtn = modal.querySelector('.cancel-delete');
    const confirmBtn = modal.querySelector('.confirm-delete');

    cancelBtn.addEventListener('click', () => {
        modal.remove();
    });

    confirmBtn.addEventListener('click', () => {
        deleteEventById(event.id);
        modal.remove();
        // 如果側邊欄是開啟的，重新載入該日期的行程
        if (sidebarDate) {
            showDayEvents(sidebarDate);
        }
    });

    // 點擊背景關閉
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // ESC 鍵關閉
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);

    document.body.appendChild(modal);

    // 聚焦到取消按鈕
    setTimeout(() => cancelBtn.focus(), 100);
}

// 打開事件彈窗
function openEventModal(event = null) {
    editingEventId = event ? event.id : null;

    // 重置表單
    eventForm.reset();

    // 預設隱藏刪除按鈕
    document.getElementById('deleteBtn').style.display = 'none';

    if (event) {
        // 編輯模式
        document.getElementById('modalTitle').textContent = '編輯行程';
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventEndDate').value = event.endDate || '';
        document.getElementById('eventTime').value = event.time || '';
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventType').value = event.type;
        document.getElementById('deleteBtn').style.display = 'inline-block';
    } else {
        // 新增模式
        document.getElementById('modalTitle').textContent = '新增行程';
        document.getElementById('eventTitle').value = '';
        if (selectedDate) {
            document.getElementById('eventDate').value = formatDate(selectedDate);
        } else {
            document.getElementById('eventDate').value = '';
        }
        document.getElementById('eventEndDate').value = '';
        document.getElementById('eventTime').value = '';
        document.getElementById('eventDescription').value = '';
        document.getElementById('eventType').value = 'personal';
    }

    // 防止背景滾動
    document.body.style.overflow = 'hidden';
    eventModal.style.display = 'block';

    // 確保彈窗滾動到頂部
    const modalContent = eventModal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.scrollTop = 0;
    }
}

// 關閉彈窗
function closeModal() {
    eventModal.style.display = 'none';
    editingEventId = null;

    // 清理 Google 事件操作區域
    const googleActionsDiv = document.getElementById('googleEventActions');
    if (googleActionsDiv) {
        googleActionsDiv.remove();
    }

    // 恢復表單狀態
    const form = document.getElementById('eventForm');
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.disabled = false;
    });

    // 恢復原始按鈕
    document.querySelector('.btn-primary').style.display = 'inline-block';
    document.getElementById('cancelBtn').textContent = '取消';

    // 恢復背景滾動
    document.body.style.overflow = '';
}

// 關閉側邊欄
function closeSidebar() {
    eventSidebar.classList.remove('open');
    // 清除側邊欄日期記錄
    sidebarDate = null;
}

// 新增行程到選中的日期
function addEventToSelectedDate() {
    // 使用側邊欄當前顯示的日期，如果沒有則使用選中日期，最後回退到今天
    const targetDate = sidebarDate || selectedDate || new Date();
    selectedDate = new Date(targetDate);

    console.log('➕ 新增行程到指定日期:', {
        targetDate: targetDate.toDateString(),
        selectedDate: selectedDate.toDateString(),
        formattedDate: formatDate(selectedDate)
    });

    // 關閉側邊欄
    closeSidebar();

    // 打開新增行程彈窗
    openEventModal();
}

// 處理表單提交
function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(eventForm);
    const startDate = document.getElementById('eventDate').value;
    const endDate = document.getElementById('eventEndDate').value;

    // 驗證日期
    if (endDate && endDate < startDate) {
        alert('結束日期不能早於開始日期！');
        return;
    }

    const eventData = {
        title: document.getElementById('eventTitle').value,
        date: startDate,
        endDate: endDate || null, // 如果沒有結束日期，設為 null
        time: document.getElementById('eventTime').value,
        description: document.getElementById('eventDescription').value,
        type: document.getElementById('eventType').value,
        owner: currentUser,
        status: document.getElementById('eventType').value === 'invitation' ? 'pending' : 'confirmed',
        isMultiDay: endDate && endDate !== startDate // 判斷是否為多日行程
    };

    // 除錯資訊
    console.log('🐱🐭 新增/編輯行程:', {
        title: eventData.title,
        owner: eventData.owner,
        currentUser: currentUser,
        type: eventData.type
    });

    if (editingEventId) {
        // 更新現有事件
        const eventIndex = events.findIndex(e => e.id === editingEventId);
        if (eventIndex !== -1) {
            events[eventIndex] = { ...events[eventIndex], ...eventData };
        }
    } else {
        // 創建新事件
        eventData.id = generateId();
        events.push(eventData);

        // 如果是邀請類型，發送 Telegram 通知給對方
        if (eventData.type === 'invitation') {
            const targetUser = getOtherUser(currentUser);
            console.log('📩 發送邀請通知:', {
                from: currentUser,
                to: targetUser,
                event: eventData.title
            });

            // 異步發送通知，不阻塞 UI
            setTimeout(() => {
                sendTelegramNotification(targetUser, 'invitation', currentUser, eventData);
            }, 500);
        }
    }

    saveEvents();
    renderCalendar();
    closeModal();

    // 如果側邊欄開啟，更新內容
    if (eventSidebar.classList.contains('open')) {
        // 使用側邊欄記住的日期，或者使用事件的日期
        const dateToShow = sidebarDate || new Date(eventData.date);
        showDayEvents(dateToShow);
    }
}

// 編輯事件
function editEvent(event) {
    openEventModal(event);
}

// 刪除事件
function deleteEvent() {
    if (editingEventId && confirm('確定要刪除這個行程嗎？')) {
        deleteEventById(editingEventId);
        closeModal();
    }
}

// 根據ID刪除事件
function deleteEventById(eventId) {
    events = events.filter(e => e.id !== eventId);
    saveEvents();
    renderCalendar();

    // 如果側邊欄開啟，更新內容
    if (eventSidebar.classList.contains('open') && selectedDate) {
        showDayEvents(selectedDate);
    }

    showNotification('行程已刪除', 'success');
}

// 接受邀請
function acceptInvitation(eventId) {
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex !== -1) {
        const event = events[eventIndex];
        const originalOwner = event.owner;

        events[eventIndex].status = 'confirmed';
        events[eventIndex].type = 'shared';
        saveEvents();
        renderCalendar();

        if (selectedDate) {
            showDayEvents(selectedDate);
        }

        showNotification('已確認參加行程！', 'success');

        // 發送接受通知給邀請者
        console.log('✅ 發送接受通知:', {
            from: currentUser,
            to: originalOwner,
            event: event.title
        });

        setTimeout(() => {
            sendTelegramNotification(originalOwner, 'accepted', currentUser, event);
        }, 500);
    }
}

// 分享 Google Calendar 事件
function shareGoogleEvent(googleEvent) {
    // 創建一個新的共享事件，基於 Google Calendar 事件
    const sharedEvent = {
        id: generateId(),
        title: googleEvent.title,
        date: googleEvent.date,
        endDate: googleEvent.endDate,
        time: googleEvent.time,
        description: `${googleEvent.description || ''}\n\n📱 從 ${currentUser === 'cat' ? '🐱' : '🐭'} 的 Google Calendar 分享`,
        type: 'shared',
        owner: currentUser,
        status: 'confirmed',
        isSharedFromGoogle: true,
        googleEventId: googleEvent.googleEventId,
        originalOwner: currentUser, // 記錄原始分享者
        isMultiDay: googleEvent.isMultiDay
    };

    // 添加到事件列表
    events.push(sharedEvent);
    saveEvents();
    renderCalendar();

    // 顯示成功通知
    const ownerText = currentUser === 'cat' ? '🐱' : '🐭';
    showNotification(`已分享 Google Calendar 行程「${googleEvent.title}」給對方`, 'success');

    console.log('📤 分享 Google Calendar 事件:', {
        originalEvent: googleEvent.title,
        sharedEventId: sharedEvent.id,
        owner: currentUser
    });
}

// 取消分享 Google Calendar 事件
function unshareGoogleEvent(googleEvent) {
    if (confirm('確定要取消分享這個 Google Calendar 行程嗎？')) {
        // 找到並移除分享的事件
        const sharedEventIndex = events.findIndex(e =>
            e.googleEventId === googleEvent.googleEventId &&
            e.isSharedFromGoogle === true &&
            !e.isFromGoogleCalendar &&
            e.originalOwner === currentUser
        );

        if (sharedEventIndex !== -1) {
            const sharedEvent = events[sharedEventIndex];
            events.splice(sharedEventIndex, 1);
            saveEvents();
            renderCalendar();

            showNotification(`已取消分享「${googleEvent.title}」`, 'info');

            console.log('📥 取消分享 Google Calendar 事件:', {
                originalEvent: googleEvent.title,
                removedEventId: sharedEvent.id
            });
        } else {
            showNotification('找不到要取消的分享事件', 'error');
        }
    }
}

// 拒絕邀請
function rejectInvitation(eventId) {
    if (confirm('確定要拒絕這個邀請嗎？')) {
        const eventIndex = events.findIndex(e => e.id === eventId);
        const event = eventIndex !== -1 ? events[eventIndex] : null;
        const originalOwner = event ? event.owner : null;

        events = events.filter(e => e.id !== eventId);
        saveEvents();
        renderCalendar();

        if (selectedDate) {
            showDayEvents(selectedDate);
        }

        showNotification('已拒絕邀請', 'info');

        // 發送拒絕通知給邀請者
        if (event && originalOwner) {
            console.log('❌ 發送拒絕通知:', {
                from: currentUser,
                to: originalOwner,
                event: event.title
            });

            setTimeout(() => {
                sendTelegramNotification(originalOwner, 'rejected', currentUser, event);
            }, 500);
        }
    }
}

// 顯示通知
function showNotification(message, type = 'info') {
    // 創建通知元素
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // 3秒後自動移除
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// 設定日期方格的拖拽支援
function setupDragAndDrop(dayElement, date) {
    // 允許放置
    dayElement.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (draggedEvent) {
            dayElement.classList.add('drag-over');
        }
    });

    dayElement.addEventListener('dragleave', (e) => {
        dayElement.classList.remove('drag-over');
    });

    // 處理放置
    dayElement.addEventListener('drop', (e) => {
        e.preventDefault();
        dayElement.classList.remove('drag-over');

        if (draggedEvent) {
            const newDate = formatDate(date);
            moveEventToDate(draggedEvent.id, newDate);
            draggedEvent = null;
            isDragging = false;
        }
    });
}

// 設定事件項目的拖拽處理
function setupEventDragHandlers(item, event) {
    item.addEventListener('dragstart', (e) => {
        draggedEvent = event;
        draggedElement = item;
        isDragging = true;

        // 設定拖拽效果
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', item.outerHTML);

        // 添加拖拽樣式
        setTimeout(() => {
            item.classList.add('dragging');
        }, 0);

        console.log('🖱️ 開始拖拽行程:', event.title);
    });

    item.addEventListener('dragend', (e) => {
        item.classList.remove('dragging');
        // 清除所有拖拽樣式
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });

        setTimeout(() => {
            isDragging = false;
        }, 100);
    });
}

// 移動事件到新日期
function moveEventToDate(eventId, newDate) {
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex !== -1) {
        const oldDate = events[eventIndex].date;
        events[eventIndex].date = newDate;

        console.log('📅 移動行程:', {
            title: events[eventIndex].title,
            from: oldDate,
            to: newDate
        });

        saveEvents();
        renderCalendar();

        // 顯示成功通知
        showNotification(`行程「${events[eventIndex].title}」已移動到新日期`, 'success');
    }
}

// 工具函數
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(date) {
    // 避免時區問題，使用本地日期
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isSameDate(date1, date2) {
    return date1.toDateString() === date2.toDateString();
}

function saveEvents() {
    // 清理事件資料，確保沒有 undefined 值
    const cleanedEvents = events.map(event => ({
        ...event,
        endDate: event.endDate === undefined ? null : event.endDate
    }));

    // 更新全域事件陣列
    events = cleanedEvents;

    // 本地備份
    localStorage.setItem('calendarEvents', JSON.stringify(events));

    // 雲端同步
    if (isFirebaseEnabled) {
        syncToFirebase();
    }
}



// 添加動畫CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 鍵盤快捷鍵
document.addEventListener('keydown', function(e) {
    // ESC 關閉彈窗
    if (e.key === 'Escape') {
        if (eventModal.style.display === 'block') {
            closeModal();
        }
        if (eventSidebar.classList.contains('open')) {
            closeSidebar();
        }
    }

        // 左右箭頭切換期間
    if (e.key === 'ArrowLeft' && !e.target.matches('input, textarea')) {
        if (currentView === 'month') {
            currentDate.setMonth(currentDate.getMonth() - 1);
        } else {
            currentDate.setDate(currentDate.getDate() - 7);
        }
        renderCalendar();
    }

    if (e.key === 'ArrowRight' && !e.target.matches('input, textarea')) {
        if (currentView === 'month') {
            currentDate.setMonth(currentDate.getMonth() + 1);
        } else {
            currentDate.setDate(currentDate.getDate() + 7);
        }
        renderCalendar();
    }

    // M 鍵切換到月視圖，W 鍵切換到週視圖
    if (e.key === 'm' || e.key === 'M') {
        switchView('month');
    }

    if (e.key === 'w' || e.key === 'W') {
        switchView('week');
    }
});

// 設置觸控滑動手勢
function setupSwipeGestures() {
    const calendarWrapper = document.querySelector('.calendar-wrapper');

    if (!calendarWrapper) return;

    // 觸控開始
    calendarWrapper.addEventListener('touchstart', handleTouchStart, { passive: true });

    // 觸控移動
    calendarWrapper.addEventListener('touchmove', handleTouchMove, { passive: false });

    // 觸控結束
    calendarWrapper.addEventListener('touchend', handleTouchEnd, { passive: true });
}

// 處理觸控開始
function handleTouchStart(e) {
    // 只在週視圖模式下啟用滑動
    if (currentView !== 'week') return;

    // 如果正在拖拽事件或在彈窗中，不處理滑動
    if (isDragging || eventModal.style.display === 'block' || eventSidebar.classList.contains('open')) {
        return;
    }

    const firstTouch = e.touches[0];
    touchStartX = firstTouch.clientX;
    touchStartY = firstTouch.clientY;
    isSwiping = false;

    console.log('👆 觸控開始:', { x: touchStartX, y: touchStartY });
}

// 處理觸控移動
function handleTouchMove(e) {
    if (currentView !== 'week' || isDragging || eventModal.style.display === 'block' || eventSidebar.classList.contains('open')) {
        return;
    }

    if (!touchStartX || !touchStartY) {
        return;
    }

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    // 檢查是否為水平滑動（水平移動距離大於垂直移動距離）
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
        isSwiping = true;
        // 防止頁面滾動
        e.preventDefault();
    }
}

// 處理觸控結束
function handleTouchEnd(e) {
    if (currentView !== 'week' || !isSwiping || isDragging || eventModal.style.display === 'block' || eventSidebar.classList.contains('open')) {
        return;
    }

    const changedTouch = e.changedTouches[0];
    touchEndX = changedTouch.clientX;
    touchEndY = changedTouch.clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // 檢查滑動距離和方向
    const minSwipeDistance = 50;
    const maxVerticalDistance = 100;

    // 確保是水平滑動且距離足夠
    if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaY) < maxVerticalDistance) {
        if (deltaX > 0) {
            // 向右滑動 - 切換到上一週
            console.log('👈 向右滑動，切換到上一週');
            currentDate.setDate(currentDate.getDate() - 7);
            renderCalendar();

            // 添加視覺回饋
            showSwipeFeedback('prev');
        } else {
            // 向左滑動 - 切換到下一週
            console.log('👉 向左滑動，切換到下一週');
            currentDate.setDate(currentDate.getDate() + 7);
            renderCalendar();

            // 添加視覺回饋
            showSwipeFeedback('next');
        }
    }

    // 重置觸控變數
    touchStartX = 0;
    touchStartY = 0;
    touchEndX = 0;
    touchEndY = 0;
    isSwiping = false;
}

// 顯示滑動回饋動畫
function showSwipeFeedback(direction) {
    const calendarWrapper = document.querySelector('.calendar-wrapper');

    // 添加滑動動畫類
    calendarWrapper.classList.add(`swipe-${direction}`);

    // 動畫結束後移除類
    setTimeout(() => {
        calendarWrapper.classList.remove(`swipe-${direction}`);
    }, 300);
}

// ==================== Google Calendar API 整合 ====================

// 驗證保存的 token 是否仍然有效
async function validateSavedToken() {
    if (!googleCalendarAuth || !googleCalendarAuth.accessToken) {
        return;
    }

    try {
        // 設置當前 token
        gapi.client.setToken({ access_token: googleCalendarAuth.accessToken });

        // 進行一個簡單的 API 調用來測試 token 是否有效
        await gapi.client.calendar.calendarList.list({ maxResults: 1 });

        console.log('✅ 保存的 access token 仍然有效');
    } catch (error) {
        console.log('⚠️ 保存的 access token 已過期');

        // 如果是 401 錯誤，表示 token 過期，靜默斷開連接
        if (error.status === 401 || (error.result && error.result.error && error.result.error.code === 401)) {
            console.log('🔄 Token 已過期，自動斷開連接');
            disconnectGoogleCalendar(true);
            updateGoogleCalendarStatus('disconnected', '授權已過期，請重新連接');
        }
    }
}

// 確保有效的 access token
async function ensureValidToken() {
    if (!googleCalendarAuth || !googleCalendarAuth.accessToken) {
        throw new Error('沒有保存的授權資訊');
    }

    // 檢查 token 是否仍然有效
    try {
        // 設置當前 token
        gapi.client.setToken({ access_token: googleCalendarAuth.accessToken });

        // 進行一個簡單的 API 調用來測試 token 是否有效
        await gapi.client.calendar.calendarList.list({ maxResults: 1 });

        console.log('✅ Access token 仍然有效');
        return;
    } catch (error) {
        console.log('⚠️ Access token 可能已過期，需要重新授權');

        // 如果是 401 錯誤，表示 token 過期
        if (error.status === 401 || (error.result && error.result.error && error.result.error.code === 401)) {
            console.log('🔄 Token 已過期，嘗試重新獲取...');

            // 清除舊的 token
            gapi.client.setToken(null);

            // 重新請求授權
            return new Promise((resolve, reject) => {
                if (!tokenClient) {
                    reject(new Error('Token client 未初始化'));
                    return;
                }

                // 設置臨時回調
                const originalCallback = tokenClient.callback;
                tokenClient.callback = (response) => {
                    // 恢復原始回調
                    tokenClient.callback = originalCallback;

                    if (response.error) {
                        console.error('重新授權失敗:', response.error);
                        reject(new Error('重新授權失敗'));
                        return;
                    }

                                        // 更新 access token
                    googleCalendarAuth.accessToken = response.access_token;
                    localStorage.setItem('googleCalendarAuth', JSON.stringify(googleCalendarAuth));

                    console.log('✅ 成功獲取新的 access token');
                    showNotification('已自動更新 Google Calendar 授權', 'success');
                    resolve();
                };

                // 請求新的 token
                tokenClient.requestAccessToken({ prompt: '' }); // 不顯示選擇帳戶提示
            });
        } else {
            // 其他錯誤，直接拋出
            throw error;
        }
    }
}

// 初始化 Google Calendar API
function initializeGoogleCalendar() {
    // 檢查是否為測試模式
    if (window.GOOGLE_CALENDAR_DEMO_MODE) {
        console.log('🧪 Google Calendar 測試模式啟用');
        updateGoogleCalendarStatus('disconnected', '測試模式 - 點擊連接體驗功能');
        return;
    }

    // 檢查配置是否正確設定
    const config = window.GOOGLE_CALENDAR_CONFIG;
    if (!config || config.apiKey === 'YOUR_API_KEY' || config.clientId === 'YOUR_CLIENT_ID') {
        console.warn('⚠️ Google Calendar API 配置未設定，使用測試模式');
        updateGoogleCalendarStatus('error', '需要設定 API 憑證');
        return;
    }

    // 先禁用連接按鈕，等待初始化完成
    const connectBtn = document.getElementById('connectGoogleCalendar');
    if (connectBtn) {
        connectBtn.disabled = true;
        connectBtn.textContent = '初始化中...';
    }

    updateGoogleCalendarStatus('connecting', '正在初始化...');

    // 檢查是否有保存的授權狀態
    const savedAuth = localStorage.getItem('googleCalendarAuth');
    if (savedAuth) {
        try {
            googleCalendarAuth = JSON.parse(savedAuth);
            // 但不立即顯示為已連接，等 API 初始化完成再檢查
        } catch (error) {
            console.warn('⚠️ Google Calendar 授權資料損壞，清除快取');
            localStorage.removeItem('googleCalendarAuth');
        }
    }

        // 載入 Google API 客戶端庫（新版本）
    if (typeof gapi !== 'undefined') {
        console.log('🔧 載入 Google API 客戶端庫...');

        // 設置初始化超時檢查
        const initTimeout = setTimeout(() => {
            if (!isGoogleApiReady) {
                console.error('⏰ Google API 初始化超時');
                updateGoogleCalendarStatus('error', '初始化超時，請檢查網路連線');
                enableGoogleCalendarButton(false);
            }
        }, 10000); // 10秒超時

        // 使用新的載入方式，只載入 client
        gapi.load('client', () => {
            clearTimeout(initTimeout);
            initGoogleApiClient();
        });
    } else {
        console.warn('⚠️ Google API 客戶端庫未載入');
        updateGoogleCalendarStatus('error', 'Google API 載入失敗');
        enableGoogleCalendarButton(false);
    }
}

// 初始化 Google API 客戶端（新版本）
async function initGoogleApiClient() {
    try {
        const config = window.GOOGLE_CALENDAR_CONFIG;
        console.log('🔧 開始初始化 Google API 客戶端...', {
            apiKey: config.apiKey ? `${config.apiKey.substring(0, 10)}...` : '未設定',
            clientId: config.clientId ? `${config.clientId.substring(0, 20)}...` : '未設定'
        });

        // 只初始化 API 客戶端，不包含 auth
        await gapi.client.init({
            apiKey: config.apiKey,
            discoveryDocs: [config.discoveryDoc]
        });

        console.log('🔗 Google Calendar API 客戶端初始化成功');

        // 初始化新的 Google Identity Services Token Client
        if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: config.clientId,
                scope: config.scopes,
                callback: (response) => {
                    if (response.error) {
                        console.error('Token 獲取失敗:', response.error);
                        updateGoogleCalendarStatus('error', '授權失敗');
                        return;
                    }

                    console.log('✅ 授權成功獲取 Token');
                    handleAuthSuccess(response.access_token);
                }
            });

            console.log('🔑 Google Identity Services 初始化成功');
            isGoogleApiReady = true;

            // 檢查是否有保存的授權
            const savedAuth = localStorage.getItem('googleCalendarAuth');
            if (savedAuth) {
                try {
                    googleCalendarAuth = JSON.parse(savedAuth);
                    updateGoogleCalendarStatus('connected', `已連接：${googleCalendarAuth.email || '用戶'}`);
                    showGoogleCalendarButtons(true);
                    isGoogleCalendarEnabled = true;

                    // 在背景中驗證 token 是否仍然有效
                    setTimeout(() => {
                        validateSavedToken();
                    }, 1000);
                } catch (error) {
                    console.warn('⚠️ 保存的授權資料無效');
                    localStorage.removeItem('googleCalendarAuth');
                    updateGoogleCalendarStatus('disconnected', '未連接 Google Calendar');
                    enableGoogleCalendarButton(true);
                }
            } else {
                updateGoogleCalendarStatus('disconnected', '未連接 Google Calendar');
                enableGoogleCalendarButton(true);
            }
        } else {
            throw new Error('Google Identity Services 未載入');
        }
    } catch (error) {
        console.error('❌ Google Calendar API 初始化失敗:', error);
        console.error('詳細錯誤:', {
            message: error.message,
            details: error.details,
            result: error.result
        });

        // 更具體的錯誤訊息
        let errorMessage = '初始化失敗';
        if (error.message) {
            if (error.message.includes('API key not valid')) {
                errorMessage = 'API 金鑰無效';
            } else if (error.message.includes('The OAuth client was not found')) {
                errorMessage = 'OAuth 客戶端未找到';
            } else if (error.message.includes('unauthorized_client')) {
                errorMessage = '客戶端未授權';
            } else if (error.message.includes('The request is missing a valid API key')) {
                errorMessage = '缺少有效的 API 金鑰';
            } else if (error.message.includes('Google Identity Services')) {
                errorMessage = 'Google Identity Services 載入失敗';
            } else {
                errorMessage = `初始化失敗: ${error.message}`;
            }
        }

        updateGoogleCalendarStatus('error', errorMessage);
        isGoogleApiReady = false;
        enableGoogleCalendarButton(false);
    }
}

// 連接 Google Calendar（新版本）
async function connectGoogleCalendar() {
    try {
        updateGoogleCalendarStatus('connecting', '正在連接...');

        // 檢查是否為測試模式
        if (window.GOOGLE_CALENDAR_DEMO_MODE) {
            // 模擬連接過程
            setTimeout(() => {
                googleCalendarAuth = {
                    email: 'demo@example.com',
                    name: '測試用戶 (Demo)',
                    accessToken: 'demo_token'
                };

                updateGoogleCalendarStatus('connected', '已連接：demo@example.com (測試模式)');
                showGoogleCalendarButtons(true);
                isGoogleCalendarEnabled = true;

                showNotification('Google Calendar 連接成功！(測試模式)', 'success');

                // 自動執行第一次同步
                setTimeout(() => {
                    syncFromGoogleCalendar();
                }, 500);
            }, 1000);
            return;
        }

        // 檢查 Google API 是否已準備就緒
        if (!isGoogleApiReady || !tokenClient) {
            throw new Error('Google API 尚未初始化完成，請稍後再試');
        }

        console.log('🔑 開始 OAuth 授權流程...');

        // 使用新的 Google Identity Services 進行授權
        tokenClient.requestAccessToken();

    } catch (error) {
        console.error('❌ Google Calendar 連接失敗:', error);
        updateGoogleCalendarStatus('error', '連接失敗');

        // 更詳細的錯誤訊息
        let errorMessage = 'Google Calendar 連接失敗';
        let showSolution = false;

        if (error.message.includes('尚未初始化')) {
            errorMessage = '正在初始化中，請稍後再試';
        } else if (error.message.includes('popup_blocked')) {
            errorMessage = '彈窗被封鎖，請允許彈窗後重試';
        } else if (error.message.includes('access_denied')) {
            errorMessage = '用戶拒絕授權';
        } else if (error.message.includes('未完成') || error.message.includes('驗證程序') ||
                   error.message.includes('blocked') || error.message.includes('unverified')) {
            errorMessage = 'Google 應用程式需要驗證';
            showSolution = true;
        } else if (error.error && error.error.includes('access_blocked')) {
            errorMessage = 'Google 應用程式需要驗證';
            showSolution = true;
        }

        showNotification(errorMessage, 'error');

        if (showSolution) {
            setTimeout(() => {
                showGoogleVerificationSolution();
            }, 1000);
        }
    }
}

// 處理授權成功
async function handleAuthSuccess(accessToken) {
    try {
        console.log('🔐 處理授權成功，獲取用戶資訊...');

        // 設置 access token
        gapi.client.setToken({ access_token: accessToken });

        // 獲取用戶的主要日曆資訊（包含 email）
        const response = await gapi.client.calendar.calendarList.list({
            maxResults: 10 // 增加數量以確保找到主要日曆
        });

        // 尋找主要日曆來獲取用戶 email
        let userEmail = '用戶';
        let userName = '用戶';

        if (response.result.items && response.result.items.length > 0) {
            // 尋找主要日曆（通常是用戶的 email）
            const primaryCalendar = response.result.items.find(cal => cal.primary === true);
            if (primaryCalendar) {
                userEmail = primaryCalendar.id; // 主要日曆的 ID 就是用戶的 email
                userName = primaryCalendar.summary || primaryCalendar.id;
            } else {
                // 如果沒找到主要日曆，使用第一個日曆
                const firstCalendar = response.result.items[0];
                userEmail = firstCalendar.id;
                userName = firstCalendar.summary || firstCalendar.id;
            }
        }

        const userInfo = {
            email: userEmail,
            name: userName,
            accessToken: accessToken
        };

        console.log('👤 獲取到用戶資訊:', {
            email: userInfo.email,
            name: userInfo.name,
            calendarCount: response.result.items ? response.result.items.length : 0
        });

        googleCalendarAuth = userInfo;

        // 保存授權資料
        localStorage.setItem('googleCalendarAuth', JSON.stringify(googleCalendarAuth));

        updateGoogleCalendarStatus('connected', `已連接：${userInfo.email}`);
        showGoogleCalendarButtons(true);
        isGoogleCalendarEnabled = true;

        showNotification('Google Calendar 連接成功！', 'success');

        // 自動執行第一次同步
        setTimeout(() => {
            syncFromGoogleCalendar();
        }, 1000);

    } catch (error) {
        console.error('❌ 處理授權成功時發生錯誤:', error);
        updateGoogleCalendarStatus('error', '授權處理失敗');
        showNotification('授權處理失敗', 'error');
    }
}

// 中斷 Google Calendar 連接（新版本）
function disconnectGoogleCalendar(skipConfirm = false) {
    if (skipConfirm || confirm('確定要中斷與 Google Calendar 的連接嗎？')) {
        try {
            // 移除之前同步的 Google Calendar 事件
            events = events.filter(event => !event.isFromGoogleCalendar);

            if (!window.GOOGLE_CALENDAR_DEMO_MODE) {
                // 撤銷 access token（新版 API）
                if (googleCalendarAuth && googleCalendarAuth.accessToken) {
                    google.accounts.oauth2.revoke(googleCalendarAuth.accessToken, () => {
                        console.log('✅ Access token 已撤銷');
                    });
                }

                // 清除 gapi client token
                gapi.client.setToken(null);
            }

            // 清除本地資料
            googleCalendarAuth = null;
            isGoogleCalendarEnabled = false;
            localStorage.removeItem('googleCalendarAuth');
            localStorage.removeItem('lastGoogleCalendarSync');

            updateGoogleCalendarStatus('disconnected', '未連接 Google Calendar');
            showGoogleCalendarButtons(false);

            // 重新渲染日曆以移除 Google 行程
            saveEvents();
            renderCalendar();

            showNotification('已中斷 Google Calendar 連接', 'info');
        } catch (error) {
            console.error('❌ 中斷連接時發生錯誤:', error);
        }
    }
}

// 從 Google Calendar 同步行程
async function syncFromGoogleCalendar() {
    if (!isGoogleCalendarEnabled || !googleCalendarAuth) {
        showNotification('請先連接 Google Calendar', 'error');
        return;
    }

    try {
        updateGoogleCalendarStatus('syncing', '同步中...');

        let googleEvents = [];

        if (window.GOOGLE_CALENDAR_DEMO_MODE) {
            // 測試模式：使用示例資料
            console.log('🧪 使用測試模式的 Google Calendar 資料');
            googleEvents = window.DEMO_GOOGLE_EVENTS || [];
        } else {
            // 真實模式：從 Google Calendar API 獲取資料

            // 檢查並刷新 token
            await ensureValidToken();

            // 確保 access token 已設置
            if (googleCalendarAuth && googleCalendarAuth.accessToken) {
                gapi.client.setToken({ access_token: googleCalendarAuth.accessToken });
            } else {
                throw new Error('無效的 access token');
            }

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            // 擴展範圍到前後各一個月
            const timeMin = new Date(startOfMonth);
            timeMin.setMonth(timeMin.getMonth() - 1);
            const timeMax = new Date(endOfMonth);
            timeMax.setMonth(timeMax.getMonth() + 1);

            const response = await gapi.client.calendar.events.list({
                calendarId: 'primary',
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                singleEvents: true,
                orderBy: 'startTime'
            });

            googleEvents = response.result.items || [];
        }

        console.log('📥 從 Google Calendar 獲取到', googleEvents.length, '個行程');

        // 轉換 Google Calendar 事件為本地格式
        const convertedEvents = googleEvents.map(convertGoogleEventToLocal);

        // 檢查是否有 undefined endDate 值
        const eventsWithUndefinedEndDate = convertedEvents.filter(event => event.endDate === undefined);
        if (eventsWithUndefinedEndDate.length > 0) {
            console.warn('⚠️ 發現有 undefined endDate 的事件:', eventsWithUndefinedEndDate);
        }

        // 移除之前同步的 Google Calendar 事件
        events = events.filter(event => !event.isFromGoogleCalendar);

        // 添加新的 Google Calendar 事件
        events.push(...convertedEvents);

        // 保存並重新渲染
        saveEvents();
        renderCalendar();

        // 記錄同步時間
        lastGoogleCalendarSync = new Date();
        localStorage.setItem('lastGoogleCalendarSync', lastGoogleCalendarSync.toISOString());

        const syncTime = lastGoogleCalendarSync.toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const modeText = window.GOOGLE_CALENDAR_DEMO_MODE ? ' (測試模式)' : '';
        updateGoogleCalendarStatus('connected', `已連接 (上次同步: ${syncTime})${modeText}`);

        showNotification(`已同步 ${convertedEvents.length} 個 Google Calendar 行程`, 'success');

    } catch (error) {
        console.error('❌ Google Calendar 同步失敗:', error);

        let errorMessage = 'Google Calendar 同步失敗';
        let statusMessage = '同步失敗';

        // 根據不同的錯誤類型提供更具體的錯誤訊息
        if (error.message.includes('沒有保存的授權資訊')) {
            errorMessage = '請重新連接 Google Calendar';
            statusMessage = '需要重新連接';
            // 重置連接狀態
            disconnectGoogleCalendar(true);
        } else if (error.message.includes('重新授權失敗')) {
            errorMessage = '重新授權失敗，請手動重新連接';
            statusMessage = '授權失敗';
        } else if (error.status === 401 || (error.result && error.result.error && error.result.error.code === 401)) {
            errorMessage = 'Google Calendar 授權已過期，請重新連接';
            statusMessage = '授權過期';
            // 重置連接狀態
            disconnectGoogleCalendar(true);
        } else if (error.status === 403) {
            errorMessage = 'Google Calendar API 配額不足或權限不夠';
            statusMessage = '權限不足';
        } else if (!navigator.onLine) {
            errorMessage = '網路連線異常，請檢查網路狀態';
            statusMessage = '網路異常';
        }

        updateGoogleCalendarStatus('error', statusMessage);
        showNotification(errorMessage, 'error');
    }
}

// 將 Google Calendar 事件轉換為本地格式
function convertGoogleEventToLocal(googleEvent) {
    const startDate = googleEvent.start.date || googleEvent.start.dateTime;
    const endDate = googleEvent.end.date || googleEvent.end.dateTime;

    // 處理日期格式
    let localStartDate, localEndDate, time = '';

    if (googleEvent.start.dateTime) {
        // 有時間的事件
        const startDateTime = new Date(googleEvent.start.dateTime);
        localStartDate = formatDate(startDateTime);
        time = startDateTime.toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        if (googleEvent.end.dateTime) {
            const endDateTime = new Date(googleEvent.end.dateTime);
            const endDateOnly = formatDate(endDateTime);
            if (endDateOnly !== localStartDate) {
                localEndDate = endDateOnly;
            }
        }
    } else {
        // 全天事件
        localStartDate = formatDate(new Date(googleEvent.start.date));
        if (googleEvent.end.date) {
            const endDate = new Date(googleEvent.end.date);
            endDate.setDate(endDate.getDate() - 1); // Google 全天事件的結束日期是下一天
            const endDateStr = formatDate(endDate);
            if (endDateStr !== localStartDate) {
                localEndDate = endDateStr;
            }
        }
    }

    return {
        id: `google_${googleEvent.id}`,
        title: googleEvent.summary || '無標題',
        date: localStartDate,
        endDate: localEndDate || null, // 確保 endDate 不是 undefined
        time: time,
        description: googleEvent.description || '從 Google Calendar 同步',
        type: 'personal',
        owner: currentUser,
        status: 'confirmed',
        isFromGoogleCalendar: true,
        googleEventId: googleEvent.id,
        isMultiDay: !!localEndDate
    };
}

// 更新 Google Calendar 狀態顯示
function updateGoogleCalendarStatus(status, text) {
    googleCalendarStatus = status;
    const statusElement = document.getElementById('googleCalendarStatus');
    const textElement = document.getElementById('googleStatusText');

    if (statusElement && textElement) {
        // 移除所有狀態類別
        statusElement.classList.remove('connected', 'disconnected', 'syncing', 'error', 'connecting');
        statusElement.classList.add(status);

        textElement.textContent = text;
    }
}

// 顯示/隱藏 Google Calendar 按鈕
function showGoogleCalendarButtons(isConnected) {
    const connectBtn = document.getElementById('connectGoogleCalendar');
    const syncBtn = document.getElementById('syncGoogleCalendar');
    const disconnectBtn = document.getElementById('disconnectGoogleCalendar');

    if (isConnected) {
        connectBtn.style.display = 'none';
        syncBtn.style.display = 'inline-flex';
        disconnectBtn.style.display = 'inline-flex';
    } else {
        connectBtn.style.display = 'inline-flex';
        syncBtn.style.display = 'none';
        disconnectBtn.style.display = 'none';
    }
}

// 啟用/禁用 Google Calendar 連接按鈕
function enableGoogleCalendarButton(enabled) {
    const connectBtn = document.getElementById('connectGoogleCalendar');
    if (connectBtn) {
        connectBtn.disabled = !enabled;
        if (enabled) {
            connectBtn.innerHTML = '<i class="fab fa-google"></i> 連接 Google Calendar';
        } else {
            connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 初始化中...';
        }
    }
}

// 顯示 Google 驗證問題的解決方案
function showGoogleVerificationSolution() {
    const solutionHtml = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            max-width: 500px;
            z-index: 10000;
            border: 3px solid #4285f4;
        ">
            <h3 style="color: #4285f4; margin-top: 0;">🔐 Google 驗證問題解決方案</h3>

            <div style="margin: 15px 0;">
                <strong>方案1：設為內部應用程式（推薦）</strong>
                <ol style="margin: 10px 0; padding-left: 20px;">
                    <li>前往 <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
                    <li>選擇你的專案</li>
                    <li>前往「API 和服務」→「OAuth 同意畫面」</li>
                    <li>將「用戶類型」改為「<strong>內部</strong>」</li>
                    <li>儲存設定</li>
                </ol>
            </div>

            <div style="margin: 15px 0;">
                <strong>方案2：添加測試用戶</strong>
                <ol style="margin: 10px 0; padding-left: 20px;">
                    <li>保持「外部」用戶類型</li>
                    <li>在「測試用戶」部分添加你的 Google 帳戶</li>
                    <li>添加所有需要測試的用戶 email</li>
                </ol>
            </div>

            <div style="margin: 15px 0;">
                <strong>方案3：暫時使用測試模式</strong>
                <p style="margin: 5px 0;">修改 google-config.js：</p>
                <code style="background: #f5f5f5; padding: 5px; display: block;">
                    GOOGLE_CALENDAR_DEMO_MODE = true
                </code>
            </div>

            <button onclick="this.parentElement.remove()" style="
                background: #4285f4;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 15px;
            ">我知道了</button>
        </div>

        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
        " onclick="this.nextElementSibling.remove(); this.remove();"></div>
    `;

    document.body.insertAdjacentHTML('beforeend', solutionHtml);
}

// ==================== Telegram 通知整合 ====================

// 初始化 Telegram 通知
function initializeTelegram() {
    console.log('📱 初始化 Telegram 通知功能...');

    try {
        // 檢查配置是否載入
        const config = window.TELEGRAM_CONFIG;
        if (!config) {
            console.warn('⚠️ Telegram 配置未載入');
            return;
        }

        telegramConfig = config;

        // 檢查是否啟用和配置是否完整
        if (config.enabled && config.botToken !== 'YOUR_BOT_TOKEN_HERE') {
            isTelegramEnabled = true;
            console.log('✅ Telegram 通知已啟用');
        } else if (config.testMode) {
            telegramConfig = window.TELEGRAM_DEMO_CONFIG || config;
            console.log('🧪 Telegram 測試模式啟用');
        } else {
            console.log('⏸️ Telegram 通知未啟用（需要設定 botToken）');
        }

        // 顯示配置狀態
        console.log('📋 Telegram 配置狀態:', {
            enabled: config.enabled,
            testMode: config.testMode,
            hasValidToken: config.botToken !== 'YOUR_BOT_TOKEN_HERE',
            catChatId: config.users?.cat?.chatId,
            mouseChatId: config.users?.mouse?.chatId
        });

    } catch (error) {
        console.error('❌ Telegram 初始化失敗:', error);
    }
}

// 發送 Telegram 通知
async function sendTelegramNotification(toUser, messageType, fromUser = null, event = null, extraData = null) {
    if (!telegramConfig || (!isTelegramEnabled && !telegramConfig.testMode)) {
        console.log('📱 Telegram 通知未啟用，跳過發送');
        return false;
    }

    try {
        const userConfig = telegramConfig.users[toUser];
        if (!userConfig) {
            console.error('❌ 找不到用戶配置:', toUser);
            return false;
        }

        // 生成訊息內容
        const messageTemplate = telegramConfig.messages[messageType];
        if (!messageTemplate) {
            console.error('❌ 找不到訊息模板:', messageType);
            return false;
        }

        let messageText;
        switch (messageType) {
            case 'invitation':
            case 'accepted':
            case 'rejected':
                messageText = messageTemplate.template(fromUser, event);
                break;
            case 'reminder':
                messageText = messageTemplate.template(event, extraData);
                break;
            default:
                messageText = '未知通知類型';
        }

        // 測試模式：只顯示通知，不實際發送
        if (telegramConfig.testMode || !isTelegramEnabled) {
            console.log('🧪 Telegram 測試通知:', {
                to: userConfig.name,
                chatId: userConfig.chatId,
                type: messageType,
                message: messageText
            });

            // 顯示測試通知彈窗
            showTelegramTestNotification(userConfig.name, messageTemplate.title, messageText);
            return true;
        }

        // 實際發送 Telegram 訊息
        const response = await fetch(`https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: userConfig.chatId,
                text: messageText,
                parse_mode: 'Markdown'
            })
        });

        if (response.ok) {
            console.log('✅ Telegram 通知發送成功:', {
                to: userConfig.name,
                type: messageType
            });
            showNotification(`已發送 Telegram 通知給 ${userConfig.name}`, 'success');
            return true;
        } else {
            const errorData = await response.json();
            console.error('❌ Telegram 發送失敗:', errorData);
            showNotification('Telegram 通知發送失敗', 'error');
            return false;
        }

    } catch (error) {
        console.error('❌ Telegram 通知發送錯誤:', error);
        showNotification('Telegram 通知發送錯誤', 'error');
        return false;
    }
}

// 顯示測試模式的通知彈窗
function showTelegramTestNotification(toUser, title, message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 25px;
        border-radius: 15px;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        border: 3px solid #4a90e2;
        animation: telegramPop 0.5s ease;
    `;

    notification.innerHTML = `
        <div style="text-align: center; margin-bottom: 15px;">
            <h3 style="margin: 0; font-size: 18px;">
                📱 Telegram 測試通知
            </h3>
            <p style="margin: 5px 0; opacity: 0.9; font-size: 14px;">
                發送給：${toUser}
            </p>
        </div>

        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin: 15px 0;">
            <h4 style="margin: 0 0 10px 0; font-size: 16px;">${title}</h4>
            <pre style="white-space: pre-wrap; font-family: inherit; margin: 0; line-height: 1.4;">${message}</pre>
        </div>

        <div style="text-align: center; margin-top: 15px;">
            <button onclick="this.closest('div').remove()" style="
                background: rgba(255,255,255,0.2);
                color: white;
                border: 1px solid rgba(255,255,255,0.3);
                padding: 10px 20px;
                border-radius: 25px;
                cursor: pointer;
                transition: all 0.3s ease;
            " onmouseover="this.style.background='rgba(255,255,255,0.3)'"
               onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                ✅ 我知道了
            </button>
        </div>
    `;

    document.body.appendChild(notification);

    // 添加動畫 CSS
    if (!document.getElementById('telegramAnimationStyle')) {
        const style = document.createElement('style');
        style.id = 'telegramAnimationStyle';
        style.textContent = `
            @keyframes telegramPop {
                0% {
                    transform: translate(-50%, -50%) scale(0.8);
                    opacity: 0;
                }
                50% {
                    transform: translate(-50%, -50%) scale(1.05);
                }
                100% {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // 5秒後自動關閉
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'telegramPop 0.3s ease reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

// 獲取對方用戶
function getOtherUser(currentUser) {
    return currentUser === 'cat' ? 'mouse' : 'cat';
}