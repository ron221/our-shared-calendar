// Google Calendar API 配置
// 請按照以下步驟設置你的 Google Calendar API：
//
// 1. 前往 Google Cloud Console (https://console.cloud.google.com/)
// 2. 創建新專案或選擇現有專案
// 3. 啟用 Google Calendar API
// 4. 創建憑證 > OAuth 2.0 客戶端 ID > Web 應用程式
// 5. 在授權的 JavaScript 來源中添加你的網域 (例如: https://yourdomain.com)
// 6. 在授權的重新導向 URI 中添加你的網域
// 7. 將下方的 YOUR_API_KEY 和 YOUR_CLIENT_ID 替換為你的實際值

window.GOOGLE_CALENDAR_CONFIG = {
    // 從 Google Cloud Console > APIs & Services > Credentials > API Keys 獲取
    apiKey: 'AIzaSyBrXGAwI8YJi37OrjqNndY73uQgNSGndLs',

    // 從 Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client IDs 獲取
    clientId: '753252895698-prkvkfhu0m54j753vc8msh2055vut1af.apps.googleusercontent.com',

    // 以下通常不需要修改
    discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
    scopes: 'https://www.googleapis.com/auth/calendar.readonly'
};

// 如果你想要測試模式（不需要真實的 Google API），請將此設為 true
window.GOOGLE_CALENDAR_DEMO_MODE = false;

// 測試模式下的示例 Google Calendar 資料
window.DEMO_GOOGLE_EVENTS = [
    {
        id: 'demo_google_1',
        summary: '團隊會議',
        start: {
            dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 明天
        },
        end: {
            dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString() // 明天+1小時
        },
        description: '每週例行會議'
    },
    {
        id: 'demo_google_2',
        summary: '牙醫預約',
        start: {
            dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 後天
        },
        end: {
            dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString() // 後天+30分鐘
        },
        description: '定期檢查'
    },
    {
        id: 'demo_google_3',
        summary: '假期',
        start: {
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 下週
        },
        end: {
            date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 下週+2天
        },
        description: '短期假期'
    }
];