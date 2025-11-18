# A股自动交易系统 - 本地运行指南

## 📋 系统要求

- **Node.js**: 18.0 或更高版本
- **操作系统**: Windows, macOS, 或 Linux

## 🚀 快速开始

### 方式一：使用启动脚本（推荐）

#### Windows用户
1. 双击 `start-local.bat` 文件
2. 系统会自动安装依赖并启动应用
3. 浏览器会自动打开 `http://localhost:5173`

#### macOS/Linux用户
1. 打开终端，进入项目目录
2. 运行命令：`bash start-local.sh`
3. 浏览器会自动打开 `http://localhost:5173`

或者给脚本添加执行权限：
```bash
chmod +x start-local.sh
./start-local.sh
```

### 方式二：手动启动

#### 第一步：安装依赖
```bash
pnpm install
```

#### 第二步：启动后端服务器
在一个终端窗口运行：
```bash
pnpm dev
```

#### 第三步：启动前端开发服务器
在另一个终端窗口运行：
```bash
pnpm dev:client
```

#### 第四步：打开浏览器
访问 `http://localhost:5173`

## 📱 应用功能

### 仪表盘
- 查看账户余额、总资产、收益率
- 快速导航到其他功能模块

### 策略管理
- 创建新的交易策略
- 配置技术指标（MA、MACD、RSI等）
- 编辑和删除已有策略
- 启用/禁用策略

### 持仓管理
- 查看当前持仓详情
- 实时显示盈亏情况
- 持仓统计分析

### 交易记录
- 查看历史交易记录
- 交易统计和分析
- 导出交易数据

## 🛠️ 开发说明

### 项目结构
```
stock_trading_app/
├── client/              # 前端React应用
│   ├── src/
│   │   ├── pages/      # 页面组件
│   │   ├── components/ # 可复用组件
│   │   └── lib/        # 工具库
│   └── index.html      # HTML入口
├── server/              # 后端Express服务
│   ├── routers.ts      # API路由
│   ├── db.ts           # 数据库操作
│   └── _core/          # 核心框架
├── drizzle/            # 数据库schema
├── start-local.sh      # Linux/Mac启动脚本
├── start-local.bat     # Windows启动脚本
└── package.json        # 项目配置
```

### 常用命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器（后端）
pnpm dev

# 启动前端开发服务器
pnpm dev:client

# 同时启动前后端
pnpm dev:all

# 构建生产版本
pnpm build

# 运行生产版本
pnpm start

# 代码检查
pnpm check

# 代码格式化
pnpm format

# 运行测试
pnpm test
```

## 🗄️ 数据存储

应用使用 **SQLite** 本地数据库，数据文件位置：
- **Windows**: `C:\Users\{用户名}\AppData\Local\stock-trading-app\`
- **macOS**: `~/Library/Application Support/stock-trading-app/`
- **Linux**: `~/.local/share/stock-trading-app/`

## ⚙️ 配置

### 修改初始资金
编辑 `server/db.ts`，找到 `getOrCreateAccount` 函数，修改 `initialBalance` 参数：

```typescript
const account = await getOrCreateAccount(
  ctx.user.id,
  1000000 // 修改这个值（单位：元）
);
```

### 修改交易品种
编辑 `server/mockMarketData.ts`，修改 `STOCKS` 数组中的股票代码和名称。

## 🐛 常见问题

### Q: 应用无法启动
**A**: 
1. 确保已安装 Node.js 18+
2. 删除 `node_modules` 文件夹和 `pnpm-lock.yaml`
3. 重新运行 `pnpm install`

### Q: 端口被占用
**A**: 
1. 修改 `server/_core/index.ts` 中的端口号（默认3000）
2. 修改 `vite.config.ts` 中的前端端口（默认5173）

### Q: 数据没有保存
**A**: 
1. 检查数据库文件是否存在
2. 确保有足够的磁盘空间
3. 检查文件夹权限

## 📞 技术支持

如有问题，请：
1. 检查浏览器控制台是否有错误信息
2. 查看终端输出日志
3. 提交Issue到GitHub

## 📄 许可证

MIT License

---

**祝您使用愉快！** 🎉

