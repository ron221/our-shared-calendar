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

// Firebase 相關變數
let database = null;
let isFirebaseEnabled = false;
let syncStatus = 'connecting';

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
        // 設定今天為選中的日期，然後開啟新增模式
        selectedDate = new Date();
        openEventModal();
    });

    // 深色模式切換按鈕
    document.getElementById('themeToggle').addEventListener('click', toggleDarkMode);

            // 側邊欄控制
    document.getElementById('closeSidebar').addEventListener('click', closeSidebar);

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

    database.ref('events').set(events)
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
    if (event.type === 'shared') {
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
        if (event.owner === currentUser || event.type === 'shared') {
            editEvent(event);
        } else {
            // 如果是別人的事件，顯示詳情
            showEventDetails(event);
        }
    });

    return item;
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
        status: event.status
    });

    if (event.type === 'shared') return 'shared-event';
    if (event.status === 'pending') return 'pending-event';
    if (event.owner === 'cat') return 'cat-event';
    if (event.owner === 'mouse') return 'mouse-event';
    return 'personal-event';
}

// 顯示某天的事件
function showDayEvents(date) {
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
}

// 創建事件列表項目
function createEventListItem(event) {
    const item = document.createElement('div');
    item.className = 'event-item';

    const title = document.createElement('div');
    title.className = 'event-title';

    // 添加行程類型和擁有者圖標
    let ownerIcon = '';
    if (event.type === 'shared') {
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

    // 點擊編輯事件
    item.addEventListener('click', () => {
        if (event.owner === currentUser || event.type === 'shared') {
            editEvent(event);
        }
    });

    return item;
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
    const ownerText = event.owner === 'cat' ? '🐱' : '🐭';
    switch (event.type) {
        case 'shared': return '🤝 共同行程';
        case 'invitation': return `📩 ${ownerText} 的邀請`;
        default: return `${ownerText} 個人行程`;
    }
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

    // 恢復背景滾動
    document.body.style.overflow = '';
}

// 關閉側邊欄
function closeSidebar() {
    eventSidebar.classList.remove('open');
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
    }

    saveEvents();
    renderCalendar();
    closeModal();

    // 如果側邊欄開啟，更新內容
    if (eventSidebar.classList.contains('open')) {
        showDayEvents(new Date(eventData.date));
    }
}

// 編輯事件
function editEvent(event) {
    openEventModal(event);
}

// 刪除事件
function deleteEvent() {
    if (editingEventId && confirm('確定要刪除這個行程嗎？')) {
        events = events.filter(e => e.id !== editingEventId);
        saveEvents();
        renderCalendar();
        closeModal();

        // 如果側邊欄開啟，更新內容
        if (eventSidebar.classList.contains('open') && selectedDate) {
            showDayEvents(selectedDate);
        }
    }
}

// 接受邀請
function acceptInvitation(eventId) {
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex !== -1) {
        events[eventIndex].status = 'confirmed';
        events[eventIndex].type = 'shared';
        saveEvents();
        renderCalendar();

        if (selectedDate) {
            showDayEvents(selectedDate);
        }

        showNotification('已確認參加行程！', 'success');
    }
}

// 拒絕邀請
function rejectInvitation(eventId) {
    if (confirm('確定要拒絕這個邀請嗎？')) {
        events = events.filter(e => e.id !== eventId);
        saveEvents();
        renderCalendar();

        if (selectedDate) {
            showDayEvents(selectedDate);
        }

        showNotification('已拒絕邀請', 'info');
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