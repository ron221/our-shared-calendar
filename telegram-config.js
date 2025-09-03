// Telegram Bot 配置
// 使用方法：
// 1. 創建 Telegram Bot：在 Telegram 搜尋 @BotFather，發送 /newbot 創建新的 Bot
// 2. 獲取 Bot Token：BotFather 會提供 Bot Token
// 3. 獲取 Chat ID：
//    - 將 Bot 加入群組或直接與 Bot 對話
//    - 發送一條訊息給 Bot
//    - 訪問：https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
//    - 在返回的 JSON 中找到 chat.id

window.TELEGRAM_CONFIG = {
    // Telegram Bot Token - 從 @BotFather 獲取
    botToken: '8421496036:AAENCJHSjzF8754S2uj-URej2ghxk3j9OZY',

    // 用戶 Chat ID 配置
    users: {
        // 貓咪用戶的 Telegram Chat ID
        cat: {
            chatId: '1012712236',
            name: '🐱 貓咪'
        },
        // 老鼠用戶的 Telegram Chat ID
        mouse: {
            chatId: 'YOUR_MOUSE_CHAT_ID_HERE',
            name: '🐭 老鼠'
        }
    },

    // 是否啟用 Telegram 通知
    enabled: true, // 設為 true 啟用，設為 false 使用測試模式

    // 測試模式設定
    testMode: false, // 在未設定真實 Token 時顯示測試訊息

    // 通知訊息模板
    messages: {
        invitation: {
            title: '📩 新的行程邀請',
            template: (fromUser, event) => `
✉️ 你收到一個新的行程邀請！

📌 **行程名稱：** ${event.title}
📆 **日期：** ${event.date}${event.endDate ? ` - ${event.endDate}` : ''}
⏰ **時間：** ${event.time || '全天'}
📝 **描述：** ${event.description || '無'}
👤 **邀請人：** ${fromUser === 'cat' ? '🐱 貓咪' : '🐭 老鼠'}

請到共享日曆確認或拒絕此邀請 💕
            `
        },
        accepted: {
            title: '✅ 邀請已被接受',
            template: (fromUser, event) => `
🎊 你的邀請已被接受！

📌 **行程名稱：** ${event.title}
📆 **日期：** ${event.date}${event.endDate ? ` - ${event.endDate}` : ''}
⏰ **時間：** ${event.time || '全天'}
👤 **接受人：** ${fromUser === 'cat' ? '🐱 貓咪' : '🐭 老鼠'}

期待與你一起度過美好時光！ 💕
            `
        },
        rejected: {
            title: '❌ 邀請已被拒絕',
            template: (fromUser, event) => `
😔 你的邀請已被拒絕

📅 **行程名稱：** ${event.title}
📆 **日期：** ${event.date}${event.endDate ? ` - ${event.endDate}` : ''}
👤 **拒絕人：** ${fromUser === 'cat' ? '🐱 貓咪' : '🐭 老鼠'}

沒關係，下次再一起安排其他活動吧！ 🤗
            `
        },
        reminder: {
            title: '⏰ 行程提醒',
            template: (event, timeUntil) => `
🔔 行程提醒

📅 **行程名稱：** ${event.title}
📆 **日期：** ${event.date}${event.endDate ? ` - ${event.endDate}` : ''}
⏰ **時間：** ${event.time || '全天'}
📝 **描述：** ${event.description || '無'}
⏳ **還有：** ${timeUntil}

準備好享受美好時光了嗎？ 💫
            `
        }
    }
};

// 測試用的示例配置（當 testMode = true 時使用）
window.TELEGRAM_DEMO_CONFIG = {
    botToken: 'demo_bot_token',
    users: {
        cat: {
            chatId: 'demo_cat_chat_id',
            name: '🐱 貓咪 (測試)'
        },
        mouse: {
            chatId: 'demo_mouse_chat_id',
            name: '🐭 老鼠 (測試)'
        }
    }
};

console.log('�� Telegram 配置載入完成');