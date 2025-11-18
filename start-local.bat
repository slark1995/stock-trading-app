@echo off
REM A股自动交易系统 - Windows启动脚本

echo ==========================================
echo A股自动交易系统
echo ==========================================
echo.

REM 检查Node.js是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误: 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

REM 检查pnpm是否安装
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo 正在安装pnpm...
    call npm install -g pnpm
)

echo 正在启动应用...
echo.

REM 安装依赖（如果需要）
if not exist "node_modules" (
    echo 正在安装依赖...
    call pnpm install
)

REM 启动开发服务器
echo 启动开发服务器...
start cmd /k "pnpm dev"

REM 等待服务器启动
timeout /t 3 /nobreak

REM 启动Vite前端开发服务器
echo 启动前端开发服务器...
start cmd /k "pnpm dev:client"

REM 等待前端启动
timeout /t 3 /nobreak

REM 自动打开浏览器
echo 正在打开浏览器...
start http://localhost:5173

echo.
echo ==========================================
echo 应用已启动！
echo 前端: http://localhost:5173
echo 后端: http://localhost:3000
echo ==========================================
echo.
echo 按任意键关闭此窗口
pause

