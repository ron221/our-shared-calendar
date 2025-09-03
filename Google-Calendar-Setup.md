# Google Calendar API 設定指南

## 🎯 功能說明

這個共享日曆現在支援與 Google Calendar 連動，可以：
- 🔗 連接你的 Google 帳戶
- 📥 自動同步 Google Calendar 的行程
- 🔄 定期更新行程資料
- 👀 在日曆中以特殊樣式顯示 Google 行程

## 🛠️ 設定步驟

### 1. 創建 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 點擊「選取專案」→「新增專案」
3. 輸入專案名稱（例如：「我的共享日曆」）
4. 點擊「建立」

### 2. 啟用 Google Calendar API

1. 在 Google Cloud Console 中，前往「API 和服務」→「程式庫」
2. 搜尋「Google Calendar API」
3. 點擊進入後，點擊「啟用」

### 3. 設定 OAuth 同意畫面

1. 前往「API 和服務」→「OAuth 同意畫面」
2. 選擇「外部」用戶類型，點擊「建立」
3. 填寫必要資訊：
   - 應用程式名稱：「貓咪小老鼠共享日曆」
   - 用戶支援電子郵件：你的電子郵件
   - 開發人員聯絡資訊：你的電子郵件
4. 點擊「儲存並繼續」
5. 在「範圍」頁面，點擊「新增或移除範圍」
6. 搜尋並添加 `../auth/calendar.readonly` 範圍
7. 繼續完成設定

### 4. 創建 OAuth 2.0 憑證

1. 前往「API 和服務」→「憑證」
2. 點擊「建立憑證」→「OAuth 2.0 用戶端 ID」
3. 選擇應用程式類型：「網頁應用程式」
4. 輸入名稱：「共享日曆網頁」
5. 在「已授權的 JavaScript 來源」中添加：
   - `http://localhost:3000`（本地測試）
   - `https://yourdomain.com`（你的實際網域）
6. 在「已授權的重新導向 URI」中添加相同的網址
7. 點擊「建立」

### 5. 獲取 API 金鑰

1. 在「憑證」頁面，點擊「建立憑證」→「API 金鑰」
2. 複製產生的 API 金鑰
3. 點擊「限制金鑰」
4. 在「API 限制」中選擇「限制金鑰」
5. 勾選「Google Calendar API」
6. 點擊「儲存」

### 6. 更新配置檔案

編輯 `google-config.js` 檔案：

```javascript
window.GOOGLE_CALENDAR_CONFIG = {
    apiKey: '你的_API_金鑰',           // 步驟5獲得的API金鑰
    clientId: '你的_客戶端_ID',        // 步驟4獲得的客戶端ID
    discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
    scopes: 'https://www.googleapis.com/auth/calendar.readonly'
};

// 設定完成後，將測試模式關閉
window.GOOGLE_CALENDAR_DEMO_MODE = false;
```

## 🧪 測試模式

在你完成 API 設定之前，可以使用測試模式體驗功能：

1. 確保 `google-config.js` 中的 `GOOGLE_CALENDAR_DEMO_MODE = true`
2. 點擊「連接 Google Calendar」按鈕
3. 系統會模擬連接過程並載入示例行程

## 🔒 安全注意事項

- ✅ API 金鑰和客戶端 ID 可以公開（它們設計為前端使用）
- ✅ 使用 `calendar.readonly` 範圍，只讀取不修改
- ✅ 用戶需要明確授權才能存取他們的日曆
- ⚠️ 如果部署到公開網站，記得在 Google Cloud Console 中更新授權網域

## 🎨 功能特色

### 視覺識別
- Google Calendar 行程會有特殊的藍綠色漸層邊框
- 標題前會有 📅 圖標
- 右上角會有小的 📅 標記

### 同步機制
- 自動同步前後各一個月的行程
- 支援全天事件和有時間的事件
- 支援多日行程
- 不會重複同步相同的行程

### 用戶體驗
- 連接狀態即時顯示
- 同步時間記錄
- 一鍵手動同步
- 簡單的中斷連接

## 🐛 疑難排解

### 常見問題

**Q: 顯示「需要設定 API 憑證」**
A: 請確認 `google-config.js` 中的 `apiKey` 和 `clientId` 已正確設定

**Q: 連接時出現「unauthorized_client」錯誤**
A: 檢查 OAuth 2.0 憑證的授權網域設定是否正確

**Q: 無法載入行程**
A: 確認 Google Calendar API 已啟用，且 API 金鑰限制設定正確

**Q: 想要雙向同步（將本地行程推送到 Google Calendar）**
A: 需要將範圍改為 `calendar`（而非 `calendar.readonly`）並實作額外的推送邏輯

## 📞 支援

如果遇到問題，可以：
1. 檢查瀏覽器開發者工具的 Console 錯誤訊息
2. 確認網路連接正常
3. 驗證 Google Cloud 專案設定

---

享受你的 Google Calendar 連動功能！🎉