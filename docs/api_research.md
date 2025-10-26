# A股交易API研究报告

## 概述

A股（沪深）自动交易涉及两个关键层面：**行情数据接口**和**交易执行接口**。根据研究，主流方案包括第三方数据服务、券商官方API和客户端自动化方案。

---

## 1. 行情数据接口

### 1.1 主流免费/付费方案

#### Tushare Pro（推荐用于数据获取）
- **特点**：稳定、数据全面、支持Python
- **数据类型**：日线行情、分钟行情、财务数据、基础信息
- **费用**：免费版有限制，Pro版付费
- **适用**：策略回测、技术指标计算、历史数据分析
- **官网**：https://tushare.pro/

#### AKShare（开源免费）
- **特点**：完全免费、开源、更新频繁
- **数据类型**：实时行情、K线数据、基本信息
- **费用**：免费
- **官网**：https://akshare.akfamily.xyz/

#### 上海证券交易所(SSE)官方数据
- **特点**：权威、免费
- **数据类型**：交易日历、上市公司信息、市场统计
- **费用**：免费
- **官网**：http://www.sse.com.cn/

---

## 2. 交易执行接口

### 2.1 券商官方API（最安全但门槛高）

**现状**：大多数A股券商对个人散户**不开放**官方交易API，主要原因：
- 风险管理考虑
- 监管要求（需要资金和技术门槛）
- 部分大型券商（如中信、海通）仅对机构客户提供

**可能的选项**：
- 中信证券、海通证券等头部券商的机构API（需要企业资质）
- 一些券商的量化平台（如富途牛牛、老虎证券等，但主要面向港美股）

---

### 2.2 第三方自动化方案（实际可用）

#### easytrader（最成熟的开源方案）
- **原理**：通过模拟同花顺/通达信客户端的操作实现自动交易
- **支持券商**：支持大部分券商（同花顺、通达信等）
- **优点**：
  - 无需券商官方支持
  - 支持多数券商
  - 开源免费
- **缺点**：
  - 依赖客户端，容易因UI更新而失效
  - 需要本地运行客户端
  - 稳定性一般
- **GitHub**：https://github.com/shidenggui/easytrader

#### 同花顺QMT（量化交易平台）
- **原理**：同花顺官方提供的量化交易接口
- **优点**：官方支持、相对稳定
- **缺点**：需要付费、学习成本高
- **官网**：https://www.10jqka.com.cn/

#### 通达信API（TdxTradeServer）
- **原理**：通达信官方交易接口
- **状态**：部分券商已关闭此接口
- **稳定性**：较低

---

## 3. 推荐实现方案

### 第一阶段：模拟交易（推荐）
1. **行情数据**：使用Tushare Pro或AKShare获取实时/历史行情
2. **策略引擎**：自建Python后端，计算技术指标（MA、MACD、RSI等）
3. **交易模拟**：在内存/数据库中模拟交易，计算盈亏
4. **前端展示**：React SPA展示持仓、交易记录、收益曲线

**优势**：
- 完全控制，稳定可靠
- 无需外部API密钥
- 适合学习和策略验证

---

### 第二阶段：实盘交易（需用户选择）

#### 选项A：easytrader + 同花顺客户端
**前提**：用户本地安装同花顺客户端
**流程**：
1. 后端集成easytrader库
2. 通过easytrader调用同花顺进行交易
3. 获取账户信息和成交记录

**实现难度**：中等
**稳定性**：一般（易因客户端更新失效）

#### 选项B：同花顺QMT API
**前提**：用户开通QMT量化交易服务
**流程**：
1. 申请QMT API权限
2. 后端调用QMT提供的接口
3. 实现下单、查询等功能

**实现难度**：中等
**稳定性**：较好

#### 选项C：期货/港美股API（如IBKR）
**前提**：用户在相关平台开户
**特点**：国际平台，API成熟度高，但不是A股

---

## 4. 技术指标实现

### 常用技术指标
- **移动平均线(MA)**：简单移动平均(SMA)、指数移动平均(EMA)
- **MACD**：快线、慢线、信号线、柱状图
- **RSI**：相对强弱指数
- **布林带(Bollinger Bands)**：上轨、中轨、下轨
- **KDJ**：随机指标

### 推荐库
- **TA-Lib**：专业技术指标库（C语言编写，Python绑定）
- **pandas-ta**：基于Pandas的技术指标库
- **NumPy/SciPy**：自建指标计算

---

## 5. 数据库设计建议

### 核心表结构
```sql
-- 用户策略表
CREATE TABLE strategies (
  id INT PRIMARY KEY,
  user_id INT,
  name VARCHAR(255),
  description TEXT,
  rules JSON,  -- 存储策略规则配置
  created_at TIMESTAMP
);

-- 持仓表
CREATE TABLE positions (
  id INT PRIMARY KEY,
  user_id INT,
  symbol VARCHAR(20),  -- 股票代码
  quantity INT,
  cost_price DECIMAL(10, 4),
  current_price DECIMAL(10, 4),
  created_at TIMESTAMP
);

-- 交易记录表
CREATE TABLE trades (
  id INT PRIMARY KEY,
  user_id INT,
  symbol VARCHAR(20),
  action ENUM('BUY', 'SELL'),
  quantity INT,
  price DECIMAL(10, 4),
  executed_at TIMESTAMP
);

-- 行情数据缓存表
CREATE TABLE market_data (
  id INT PRIMARY KEY,
  symbol VARCHAR(20),
  date DATE,
  open DECIMAL(10, 4),
  high DECIMAL(10, 4),
  low DECIMAL(10, 4),
  close DECIMAL(10, 4),
  volume BIGINT
);
```

---

## 6. 项目实现路线图

### MVP（第一阶段）
- ✅ 前端：策略配置、持仓展示、交易记录
- ✅ 后端：策略引擎、交易模拟、技术指标计算
- ✅ 数据：Tushare/AKShare行情数据集成

### 增强版（第二阶段）
- 实时行情推送（WebSocket）
- 高级图表（K线、技术指标可视化）
- 策略回测功能
- 用户权限和多账户支持

### 实盘版（第三阶段）
- 集成easytrader或QMT API
- 真实订单下单和成交跟踪
- 风险管理（止损、止盈）
- 审计日志和合规报告

---

## 7. 法律和风险提示

1. **监管合规**：A股自动交易涉及监管，确保符合证监会规定
2. **风险免责**：任何交易策略都存在风险，需明确风险提示
3. **数据安全**：妥善保管用户API密钥和账户信息
4. **测试充分**：在模拟环境充分测试后再进行实盘交易

---

## 参考资源

- Tushare Pro：https://tushare.pro/
- AKShare：https://akshare.akfamily.xyz/
- easytrader：https://github.com/shidenggui/easytrader
- TA-Lib：https://github.com/mrjbq7/ta-lib
- 同花顺QMT：https://www.10jqka.com.cn/


