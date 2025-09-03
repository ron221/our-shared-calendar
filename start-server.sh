#!/bin/bash

echo "🚀 啟動共享日曆本地伺服器..."
echo "📍 伺服器地址: http://localhost:8000"
echo "🛑 按 Ctrl+C 停止伺服器"
echo ""

# 檢查 Python 版本並啟動對應的伺服器
if command -v python3 &> /dev/null; then
    echo "使用 Python 3 啟動伺服器..."
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "使用 Python 2 啟動伺服器..."
    python -m SimpleHTTPServer 8000
else
    echo "❌ 未找到 Python，請安裝 Python 後重試"
    exit 1
fi