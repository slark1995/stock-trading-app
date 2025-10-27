# A股自动交易系统

一个基于技术指标和自定义策略的A股（沪深）自动交易平台，支持策略管理、模拟交易、实时行情和风险管理。

## 功能特性

### 核心功能
- **策略管理**：支持技术指标策略和自定义规则策略
- **技术指标**：MA（移动平均线）、MACD、RSI、布林带等常用指标
- **模拟交易**：完整的交易模拟引擎，支持买入/卖出信号生成
- **持仓管理**：实时持仓查询、盈亏计算、成本价追踪
- **交易记录**：完整的交易历史记录和统计分析
- **账户管理**：虚拟账户、资金管理、收益率计算

### 前端特性
- 现代化UI设计（React 19 + Tailwind CSS）
- 响应式布局，支持桌面端和移动端
- 实时数据更新
- 直观的图表和数据展示

### 后端特性
- tRPC全栈类型安全
- MySQL数据库存储
- 完整的API接口
- 模拟行情数据生成

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 19, Tailwind CSS 4, shadcn/ui, Wouter |
| **后端** | Express 4, tRPC 11, Node.js |
| **数据库** | MySQL, Drizzle ORM |
| **认证** | Manus OAuth |
| **其他** | TypeScript, Vite, pnpm |

## 项目结构

```
stock_trading_app/
├── client/                 # 前端应用
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   │   ├── Dashboard.tsx      # 仪表盘
│   │   │   ├── Strategies.tsx     # 策略管理
│   │   │   ├── Positions.tsx      # 持仓管理
│   │   │   └── Trades.tsx         # 交易记录
│   │   ├── components/    # 可复用组件
│   │   ├── lib/           # 工具库
│   │   └── App.tsx        # 主应用
│   └── package.json
├── server/                 # 后端服务
│   ├── routers.ts         # tRPC路由定义
│   ├── db.ts              # 数据库查询函数
│   ├── indicators.ts      # 技术指标计算
│   ├── tradingEngine.ts   # 交易模拟引擎
│   ├── strategyExecutor.ts # 策略执行服务
│   ├── marketRouter.ts    # 行情数据API
│   └── mockMarketData.ts  # 模拟行情数据
├── drizzle/               # 数据库schema
│   └── schema.ts          # 表定义
└── docs/                  # 文档
    └── api_research.md    # API研究报告
```

## 快速开始

### 前置要求
- Node.js 18+
- MySQL 8.0+
- pnpm 8+

### 安装依赖
```bash
pnpm install
```

### 数据库初始化
```bash
pnpm db:push
```

### 启动开发服务器
```bash
pnpm dev
```

访问 http://localhost:3000 查看应用

## 使用指南

### 1. 登录
使用Manus OAuth进行登录，系统会自动为您创建账户和虚拟资金（默认100万元）。

### 2. 创建策略
在"策略管理"页面创建策略：
- **技术指标策略**：选择MA、MACD、RSI等指标组合
- **自定义策略**：定义买卖条件的JSON规则

### 3. 配置策略参数
- **止损百分比**：亏损达到此比例时自动卖出
- **止盈百分比**：收益达到此比例时自动卖出
- **最大持仓数量**：单笔交易的最大股数

### 4. 执行交易
- 策略自动扫描市场信号
- 生成买卖信号时自动执行交易
- 查看"交易记录"了解成交详情

### 5. 监控持仓
在"持仓管理"页面实时查看：
- 当前持仓数量和成本价
- 市场价值和浮动盈亏
- 持仓收益率

## API文档

### 行情数据接口

#### 获取单个股票行情
```typescript
trpc.market.getQuote.query({ symbol: "600000.SH" })
```

#### 获取所有热门股票
```typescript
trpc.market.getAllQuotes.query()
```

#### 获取K线数据
```typescript
trpc.market.getKlines.query({ 
  symbol: "600000.SH", 
  period: "1d", 
  limit: 100 
})
```

### 交易接口

#### 获取账户信息
```typescript
trpc.trading.getAccount.query({ initialBalance: 1000000 })
```

#### 创建策略
```typescript
trpc.trading.createStrategy.mutate({
  name: "均线交叉策略",
  description: "MA5穿过MA20时买入",
  strategyType: "technical",
  rules: JSON.stringify({ /* 规则配置 */ })
})
```

#### 获取持仓
```typescript
trpc.trading.getPositions.query()
```

#### 获取交易记录
```typescript
trpc.trading.getTrades.query({ limit: 100 })
```

## 数据库设计

### 核心表

| 表名 | 说明 |
|------|------|
| `users` | 用户信息 |
| `accounts` | 用户账户（虚拟资金） |
| `strategies` | 交易策略 |
| `positions` | 当前持仓 |
| `trades` | 交易记录 |
| `marketData` | 行情数据缓存 |

## 技术指标说明

### 移动平均线 (MA)
计算指定周期内的平均价格，用于判断趋势方向。

```typescript
MA5: 5日移动平均
MA10: 10日移动平均
MA20: 20日移动平均
```

### MACD (Moving Average Convergence Divergence)
由快线(12日EMA)、慢线(26日EMA)和信号线(9日EMA)组成。
- 快线>慢线：看涨信号
- 快线<慢线：看跌信号

### RSI (Relative Strength Index)
衡量价格动能和变化速度。
- RSI < 30：超卖，可能反弹
- RSI > 70：超买，可能回调

### 布林带 (Bollinger Bands)
由中轨(20日MA)、上轨和下轨组成。
- 价格触及下轨：可能反弹
- 价格触及上轨：可能回调

## 交易规则

### 买入条件
- 价格在MA5上方，MA5在MA20上方
- RSI < 30（超卖）
- MACD出现金叉
- 价格低于布林带下轨

### 卖出条件
- 价格在MA5下方，MA5在MA20下方
- RSI > 70（超买）
- MACD出现死叉
- 价格高于布林带上轨
- 止损/止盈条件触发

## 模拟行情数据

系统内置模拟行情数据生成器，支持以下热门股票：

| 代码 | 名称 |
|------|------|
| 600000.SH | 浦发银行 |
| 600519.SH | 贵州茅台 |
| 000001.SZ | 平安银行 |
| 000858.SZ | 五粮液 |
| 300750.SZ | 宁德时代 |

完整列表见 `server/mockMarketData.ts`

## 实盘交易集成

### 支持的券商

1. **easytrader方案**（推荐）
   - 支持同花顺客户端
   - 支持大部分券商
   - 需要本地运行客户端

2. **同花顺QMT**
   - 官方量化交易平台
   - 相对稳定
   - 需要付费开通

3. **其他券商API**
   - 中信证券、海通证券等
   - 需要企业资质

### 集成步骤

1. 在"账户设置"中配置券商API密钥
2. 验证账户连接
3. 在策略中启用实盘交易模式
4. 系统会自动将模拟交易转换为真实订单

## 风险提示

⚠️ **重要声明**

1. **市场风险**：股票交易存在风险，过往表现不代表未来结果
2. **策略风险**：自动交易策略可能失效，需要定期评估
3. **技术风险**：系统故障可能导致交易延迟或失败
4. **资金风险**：使用实盘交易前，请充分了解风险

**本系统仅供学习和演示使用，不构成投资建议。**

## 常见问题

### Q: 如何修改初始资金？
A: 在创建账户时传入 `initialBalance` 参数，或直接修改数据库。

### Q: 支持哪些股票？
A: 目前支持模拟数据中的热门股票。集成真实行情后支持所有A股。

### Q: 如何导出交易记录？
A: 在"交易记录"页面可以查看详细记录，支持按日期筛选。

### Q: 策略多久执行一次？
A: 默认每5分钟执行一次，可在配置中修改。

## 后续开发计划

- [ ] 集成Tushare/AKShare真实行情数据
- [ ] 实现WebSocket实时推送
- [ ] 添加策略回测功能
- [ ] 支持更多技术指标
- [ ] 实现风险管理面板
- [ ] 添加通知提醒功能
- [ ] 支持多账户管理
- [ ] 实现策略模板库

## 贡献指南

欢迎提交Issue和Pull Request！

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过以下方式联系：
- 提交Issue
- 发送邮件

---

**最后更新**：2025年10月26日

