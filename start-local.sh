#!/bin/bash

# A股自动交易系统 - 本地启动脚本

echo "=========================================="
echo "A股自动交易系统"
echo "=========================================="
echo ""

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

# 检查pnpm是否安装
if ! command -v pnpm &> /dev/null; then
    echo "正在安装pnpm..."
    npm install -g pnpm
fi

echo "正在启动应用..."
echo ""

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    pnpm install
fi

# 启动开发服务器
echo "启动开发服务器..."
pnpm dev &
SERVER_PID=$!

# 等待服务器启动
sleep 3

# 启动Vite前端开发服务器
echo "启动前端开发服务器..."
pnpm dev:client &
CLIENT_PID=$!

# 等待前端启动
sleep 3

# 自动打开浏览器
echo "正在打开浏览器..."
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173
elif command -v open &> /dev/null; then
    open http://localhost:5173
elif command -v start &> /dev/null; then
    start http://localhost:5173
fi

echo ""
echo "=========================================="
echo "应用已启动！"
echo "前端: http://localhost:5173"
echo "后端: http://localhost:3000"
echo "=========================================="
echo ""
echo "按 Ctrl+C 停止应用"
echo ""

# 等待用户中断
wait $SERVER_PID $CLIENT_PID

