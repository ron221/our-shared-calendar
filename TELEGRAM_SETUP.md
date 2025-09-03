# 📱 Telegram 通知設定指南

## 📋 功能介紹

共享日曆現在支援 Telegram 通知功能！當有新的邀請、邀請被接受或拒絕時，會自動發送通知到對方的 Telegram。

## 🚀 快速開始

### 1. 創建 Telegram Bot

1. 在 Telegram 中搜尋 `@BotFather`
2. 發送 `/newbot` 命令
3. 按照指示設定 Bot 名稱和用戶名
4. 複製獲得的 **Bot Token**

### 2. 獲取 Chat ID

#### 方法一：個人聊天
1. 搜尋並開始與你剛創建的 Bot 對話
2. 發送任意訊息給 Bot（例如：`/start`）
3. 在瀏覽器中訪問：
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
4. 在返回的 JSON 中找到 `"chat":{"id":123456789...}`
5. 複製這個數字作為你的 Chat ID

#### 方法二：群組聊天
1. 創建一個 Telegram 群組
2. 將 Bot 加入群組
3. 在群組中發送一條訊息
4. 使用上述 URL 獲取 updates，群組的 Chat ID 通常是負數

### 3. 修改配置文件

編輯 `telegram-config.js`：

```javascript
window.TELEGRAM_CONFIG = {
    // 填入你的 Bot Token
    botToken: '1234567890:ABCdefGHIjklMNOpqrsTUVwxyz',

    users: {
        cat: {
            chatId: '123456789',      // 貓咪用戶的 Chat ID
            name: '🐱 貓咪'
        },
        mouse: {
            chatId: '987654321',      // 老鼠用戶的 Chat ID
            name: '🐭 老鼠'
        }
    },

    // 啟用真實通知
    enabled: true,
    testMode: false
};
```

## 🧪 測試模式

如果你想先測試功能但還沒設定 Bot，可以使用測試模式：

```javascript
window.TELEGRAM_CONFIG = {
    // 保持預設值
    botToken: 'YOUR_BOT_TOKEN_HERE',

    // 啟用測試模式
    enabled: false,
    testMode: true
};
```

測試模式會顯示通知彈窗而不會實際發送 Telegram 訊息。

## 📱 通知類型

系統會在以下情況發送通知：

### 📩 邀請通知
當有人創建 `邀請` 類型的行程時，會通知對方：
```
🎉 你收到一個新的行程邀請！

📅 行程名稱： 一起看電影
📆 日期： 2024-12-20
⏰ 時間： 19:00
📝 描述： 看最新的電影
👤 邀請人： 🐱 貓咪

請到共享日曆確認或拒絕此邀請 💕
```

### ✅ 接受通知
當邀請被接受時，會通知邀請者：
```
🎊 好消息！你的邀請已被接受！

📅 行程名稱： 一起看電影
📆 日期： 2024-12-20
⏰ 時間： 19:00
👤 接受人： 🐭 老鼠

期待與你一起度過美好時光！ 💕
```

### ❌ 拒絕通知
當邀請被拒絕時，會通知邀請者：
```
😔 你的邀請已被拒絕

📅 行程名稱： 一起看電影
📆 日期： 2024-12-20
👤 拒絕人： 🐭 老鼠

沒關係，下次再一起安排其他活動吧！ 🤗
```

## 🔧 故障排除

### Bot Token 無效
- 確認 Token 是從 @BotFather 正確複製的
- 檢查 Token 格式是否正確（應該像：`1234567890:ABCdefGHI...`）

### Chat ID 錯誤
- 確認已經與 Bot 發送過訊息
- 檢查 `/getUpdates` API 返回的數據
- 群組 Chat ID 通常是負數

### 通知沒有發送
1. 檢查瀏覽器 Console 是否有錯誤訊息
2. 確認網路連線正常
3. 驗證 Bot Token 和 Chat ID 設定正確
4. 檢查 `enabled: true` 設定

### CORS 錯誤
如果遇到 CORS 錯誤，可能需要：
- 使用伺服器端代理
- 或者考慮使用 Telegram Bot Webhook 模式

## 🎨 自訂訊息

你可以在 `telegram-config.js` 中修改 `messages` 部分來自訂通知訊息格式：

```javascript
messages: {
    invitation: {
        title: '📩 新的行程邀請',
        template: (fromUser, event) => `
            自訂的邀請訊息內容...
            行程：${event.title}
            邀請人：${fromUser === 'cat' ? '🐱' : '🐭'}
        `
    }
}
```

## 🔐 安全性建議

1. **不要將 Bot Token 提交到公開的版本控制系統**
2. **定期更換 Bot Token**
3. **只與信任的人分享 Chat ID**
4. **考慮使用環境變數儲存敏感資訊**

## 📚 進階功能

### 支援多個通知渠道

除了 Telegram，你也可以擴展支援其他通知方式：
- Line Notify
- Discord Webhooks
- Email 通知
- 瀏覽器推送通知

### 行程提醒

未來可以擴展自動提醒功能，在行程開始前發送提醒通知。

---

## 🤝 需要幫助？

如果遇到任何問題，請檢查：
1. 瀏覽器開發者工具的 Console
2. 網路連線狀態
3. Telegram Bot 設定是否正確

享受你的智慧共享日曆！ 🐱🐭💕