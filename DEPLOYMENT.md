# A股自动交易系统 - 部署指南

本文档说明如何部署和配置A股自动交易系统。

## 目录
1. [系统要求](#系统要求)
2. [开发环境部署](#开发环境部署)
3. [生产环境部署](#生产环境部署)
4. [券商API集成](#券商api集成)
5. [配置管理](#配置管理)
6. [监控和日志](#监控和日志)
7. [故障排查](#故障排查)

## 系统要求

### 最低配置
- **CPU**: 2核心
- **内存**: 4GB RAM
- **存储**: 20GB SSD
- **网络**: 100Mbps 互联网连接

### 软件依赖
- Node.js 18.0.0 或更高版本
- MySQL 8.0 或更高版本（或 MariaDB 10.5+）
- Redis 6.0 或更高版本（可选，用于缓存）
- Docker 20.10+（可选，用于容器化部署）

### 系统要求
- Linux (Ubuntu 20.04 LTS 推荐) 或 macOS 12+
- Windows Server 2019+ (需要WSL2)

## 开发环境部署

### 1. 克隆项目
```bash
git clone <repository-url>
cd stock_trading_app
```

### 2. 安装依赖
```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

### 3. 配置环境变量
创建 `.env.local` 文件：
```env
# 数据库配置
DATABASE_URL=mysql://user:password@localhost:3306/stock_trading_app

# OAuth 配置
VITE_OAUTH_PORTAL_URL=https://oauth.example.com
OAUTH_SERVER_URL=https://api.example.com
VITE_APP_ID=your_app_id
JWT_SECRET=your_jwt_secret

# 应用配置
VITE_APP_TITLE=A股自动交易系统
VITE_APP_LOGO=https://example.com/logo.png

# API 配置
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_api_key
```

### 4. 初始化数据库
```bash
# 推送 schema 到数据库
pnpm db:push

# 或生成迁移文件
pnpm db:generate
pnpm db:migrate
```

### 5. 启动开发服务器
```bash
pnpm dev
```

访问 http://localhost:3000

## 生产环境部署

### 使用 Docker 部署（推荐）

#### 1. 构建 Docker 镜像
```bash
docker build -t stock-trading-app:latest .
```

#### 2. 创建 docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    image: stock-trading-app:latest
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: mysql://user:password@db:3306/stock_trading_app
      NODE_ENV: production
      VITE_APP_TITLE: A股自动交易系统
    depends_on:
      - db
    restart: always

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: stock_trading_app
      MYSQL_USER: user
      MYSQL_PASSWORD: password
    volumes:
      - db_data:/var/lib/mysql
    restart: always

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: always

volumes:
  db_data:
```

#### 3. 启动容器
```bash
docker-compose up -d
```

### 使用 PM2 部署（传统方式）

#### 1. 安装 PM2
```bash
npm install -g pm2
```

#### 2. 构建应用
```bash
pnpm build
```

#### 3. 创建 ecosystem.config.js
```javascript
module.exports = {
  apps: [
    {
      name: 'stock-trading-app',
      script: './dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: 'mysql://user:password@localhost:3306/stock_trading_app'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
```

#### 4. 启动应用
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 使用 Nginx 反向代理

```nginx
upstream stock_trading_app {
  server localhost:3000;
  keepalive 64;
}

server {
  listen 80;
  server_name example.com;

  # 重定向到 HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name example.com;

  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;

  client_max_body_size 100M;

  location / {
    proxy_pass http://stock_trading_app;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # API 缓存
  location /api/market {
    proxy_pass http://stock_trading_app;
    proxy_cache_valid 200 1m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
  }
}
```

## 券商API集成

### EasyTrader 集成

#### 1. 安装 EasyTrader
```bash
pip install easytrader
```

#### 2. 启动 EasyTrader 服务
```bash
# 方式1：直接运行
python -m easytrader.server --port 8888

# 方式2：后台运行
nohup python -m easytrader.server --port 8888 > easytrader.log 2>&1 &
```

#### 3. 配置应用
在应用中配置 EasyTrader 连接：
```typescript
const config = {
  type: 'easytrader',
  brokerName: 'ths',  // 同花顺
  accountId: 'your_account_id'
};

await trpc.liveTrade.configureBroker.mutate(config);
```

### 同花顺 QMT 集成

#### 1. 开通 QMT 服务
访问 https://www.ths.com.cn/ 开通 QMT 服务

#### 2. 获取 API 凭证
- API Key
- API Secret
- Account ID

#### 3. 配置应用
```typescript
const config = {
  type: 'qmt',
  apiKey: 'your_api_key',
  apiSecret: 'your_api_secret',
  accountId: 'your_account_id'
};

await trpc.liveTrade.configureBroker.mutate(config);
```

## 配置管理

### 环境变量

| 变量名 | 说明 | 示例 |
|-------|------|------|
| `NODE_ENV` | 运行环境 | `production` |
| `DATABASE_URL` | 数据库连接 | `mysql://user:pass@host/db` |
| `PORT` | 应用端口 | `3000` |
| `LOG_LEVEL` | 日志级别 | `info` |
| `REDIS_URL` | Redis 连接 | `redis://localhost:6379` |

### 数据库配置

#### MySQL 连接池
```typescript
// server/db.ts
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

### 策略配置

#### 技术指标策略配置
```json
{
  "indicators": {
    "ma5": true,
    "ma10": true,
    "ma20": true,
    "rsi14": true,
    "macd": true
  },
  "stopLoss": 5,
  "takeProfit": 10,
  "maxPositionSize": 1000
}
```

## 监控和日志

### 日志配置

#### 使用 Winston 记录日志
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 监控指标

#### 关键指标
- 应用可用性（Uptime）
- 响应时间（Response Time）
- 错误率（Error Rate）
- 数据库连接数
- 内存使用率
- CPU 使用率

#### 使用 Prometheus
```typescript
import promClient from 'prom-client';

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});
```

### 告警设置

#### 告警规则
- 应用宕机超过 1 分钟
- 错误率超过 5%
- 响应时间超过 5 秒
- 数据库连接失败

## 故障排查

### 常见问题

#### 1. 数据库连接失败
```bash
# 检查 MySQL 服务
sudo systemctl status mysql

# 测试连接
mysql -h localhost -u user -p database_name

# 查看错误日志
tail -f /var/log/mysql/error.log
```

#### 2. 应用启动失败
```bash
# 检查端口占用
lsof -i :3000

# 查看应用日志
pm2 logs stock-trading-app

# 检查环境变量
env | grep DATABASE_URL
```

#### 3. 券商连接失败
```bash
# 检查 EasyTrader 服务
curl http://localhost:8888/status

# 查看 EasyTrader 日志
tail -f easytrader.log

# 验证账户信息
python -c "import easytrader; client = easytrader.use('ths'); print(client.balance)"
```

#### 4. 交易执行失败
- 检查账户余额是否充足
- 验证交易时间（A股交易时间）
- 检查股票代码是否正确
- 查看策略规则配置

### 性能优化

#### 1. 数据库优化
```sql
-- 创建索引
CREATE INDEX idx_user_id ON trades(user_id);
CREATE INDEX idx_symbol ON positions(symbol);
CREATE INDEX idx_created_at ON trades(created_at);
```

#### 2. 缓存优化
```typescript
// 使用 Redis 缓存行情数据
const quote = await redis.get(`quote:${symbol}`);
if (!quote) {
  const data = await fetchQuote(symbol);
  await redis.setex(`quote:${symbol}`, 300, JSON.stringify(data));
}
```

#### 3. 查询优化
```typescript
// 使用分页
const trades = await db.query(
  'SELECT * FROM trades WHERE user_id = ? LIMIT ? OFFSET ?',
  [userId, limit, offset]
);
```

## 备份和恢复

### 数据库备份
```bash
# 每日备份
mysqldump -u user -p database_name > backup_$(date +%Y%m%d).sql

# 使用 cron 定时备份
0 2 * * * mysqldump -u user -p database_name > /backup/db_$(date +\%Y\%m\%d).sql
```

### 恢复数据
```bash
mysql -u user -p database_name < backup_20250101.sql
```

## 安全建议

1. **使用 HTTPS**：所有通信使用 SSL/TLS 加密
2. **API 密钥管理**：使用环境变量存储敏感信息
3. **数据库安全**：
   - 使用强密码
   - 限制数据库访问 IP
   - 定期更新数据库版本
4. **应用安全**：
   - 定期更新依赖包
   - 使用 Web 应用防火墙
   - 实施速率限制
5. **账户安全**：
   - 启用双因素认证
   - 定期审计访问日志
   - 限制 API 权限

## 支持和反馈

如有部署问题，请：
1. 查看日志文件
2. 检查系统资源
3. 提交 Issue
4. 联系技术支持

---

**最后更新**：2025年10月26日

