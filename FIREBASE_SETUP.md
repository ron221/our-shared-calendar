# 🔥 Firebase 即時同步設定指南

## 📋 步驟一：建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「建立專案」
3. 輸入專案名稱：`shared-calendar`
4. 選擇是否啟用 Google Analytics（可選）
5. 點擊「建立專案」

## 📋 步驟二：設定 Realtime Database

1. 在 Firebase Console 中，點擊左側選單的「Realtime Database」
2. 點擊「建立資料庫」
3. 選擇資料庫位置（建議選擇亞洲地區）
4. 安全性規則選擇「測試模式」（暫時）

## 📋 步驟三：取得 Firebase 配置

1. 在專案總覽中，點擊「專案設定」（齒輪圖標）
2. 滾動到「您的應用程式」區域
3. 點擊「</> Web」圖標
4. 輸入應用程式名稱：`shared-calendar-web`
5. 複製 Firebase 配置物件

## 📋 步驟四：更新程式碼

將 `script.js` 中的 `firebaseConfig` 替換為您的真實配置：

```javascript
const firebaseConfig = {
    apiKey: "您的-API-KEY",
    authDomain: "您的專案.firebaseapp.com",
    databaseURL: "https://您的專案-default-rtdb.firebaseio.com",
    projectId: "您的專案ID",
    storageBucket: "您的專案.appspot.com",
    messagingSenderId: "您的MessagingSenderID",
    appId: "您的AppID"
};
```

## 📋 步驟五：設定安全性規則

在 Realtime Database 的「規則」標籤中，設定以下規則：

```json
{
  "rules": {
    "events": {
      ".read": true,
      ".write": true
    }
  }
}
```

⚠️ **注意**：這是簡化的規則，實際部署時建議加入更嚴格的安全性控制。

## 📋 步驟六：部署和測試

1. 將更新後的程式碼推送到 GitHub
2. 等待 GitHub Pages 更新
3. 在不同設備上開啟網站測試同步功能

## 🎯 功能特色

- **即時同步**：任何設備上的變更會立即同步到其他設備
- **離線支援**：網路中斷時自動切換到本地模式
- **衝突處理**：Firebase 自動處理併發更新
- **狀態指示**：清楚顯示連線和同步狀態

## 🔒 安全性建議

實際部署時，建議設定更嚴格的安全性規則：

```json
{
  "rules": {
    "events": {
      ".read": "auth != null",
      ".write": "auth != null",
      ".validate": "newData.hasChildren(['id', 'title', 'date', 'owner'])"
    }
  }
}
```

## 💰 費用說明

Firebase Realtime Database 的免費方案包含：
- 1GB 儲存空間
- 10GB/月 傳輸量

對於個人使用的日曆應用來說，免費方案完全足夠。

## 🚀 進階功能

未來可以加入的功能：
- 使用者認證（Firebase Auth）
- 推送通知
- 離線資料快取
- 資料備份和恢復