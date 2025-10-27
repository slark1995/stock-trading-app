/**
 * 模拟行情数据生成器
 * 为演示和测试生成逼真的A股行情数据
 */

export interface MockStockData {
  symbol: string;
  name: string;
  currentPrice: number;
  previousClose: number;
  high: number;
  low: number;
  volume: number;
  changePercent: number;
}

// 常见A股股票列表
const POPULAR_STOCKS = [
  { symbol: "600000.SH", name: "浦发银行" },
  { symbol: "600016.SH", name: "民生银行" },
  { symbol: "600028.SH", name: "中国石化" },
  { symbol: "600030.SH", name: "中信证券" },
  { symbol: "600036.SH", name: "招商银行" },
  { symbol: "600048.SH", name: "保利地产" },
  { symbol: "600050.SH", name: "中国联通" },
  { symbol: "600104.SH", name: "上汽集团" },
  { symbol: "600111.SH", name: "北京控股" },
  { symbol: "600519.SH", name: "贵州茅台" },
  { symbol: "000001.SZ", name: "平安银行" },
  { symbol: "000002.SZ", name: "万科A" },
  { symbol: "000333.SZ", name: "美的集团" },
  { symbol: "000651.SZ", name: "格力电器" },
  { symbol: "000858.SZ", name: "五粮液" },
  { symbol: "000963.SZ", name: "华东医药" },
  { symbol: "002142.SZ", name: "申通快递" },
  { symbol: "002304.SZ", name: "洋河股份" },
  { symbol: "002415.SZ", name: "海康威视" },
  { symbol: "300750.SZ", name: "宁德时代" },
];

/**
 * 生成模拟股票价格
 * 使用随机游走模型生成逼真的价格变动
 */
export function generateMockPrice(
  basePrice: number,
  volatility: number = 0.02,
  trend: number = 0
): number {
  // 随机游走
  const randomChange = (Math.random() - 0.5) * 2 * volatility;
  const trendComponent = trend;
  const change = randomChange + trendComponent;

  const newPrice = basePrice * (1 + change);
  return Math.round(newPrice * 100) / 100;
}

/**
 * 生成一天的OHLCV数据
 */
export function generateDailyOHLCV(
  symbol: string,
  date: Date,
  previousClose: number
): {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
} {
  // 生成开盘价（接近前收盘价）
  const open = generateMockPrice(previousClose, 0.01);

  // 生成日内最高价和最低价
  const dailyVolatility = 0.03 + Math.random() * 0.02;
  const high = Math.max(open, previousClose) * (1 + Math.abs(Math.random() * dailyVolatility));
  const low = Math.min(open, previousClose) * (1 - Math.abs(Math.random() * dailyVolatility));

  // 生成收盘价（在最高价和最低价之间）
  const close = low + Math.random() * (high - low);

  // 生成成交量（单位：万股）
  const baseVolume = 1000 + Math.random() * 5000;
  const volume = Math.round(baseVolume * (1 + (Math.random() - 0.5) * 0.5));

  return {
    open: Math.round(open * 100) / 100,
    high: Math.round(high * 100) / 100,
    low: Math.round(low * 100) / 100,
    close: Math.round(close * 100) / 100,
    volume,
  };
}

/**
 * 生成历史价格数据（用于技术指标计算）
 */
export function generateHistoricalPrices(
  symbol: string,
  days: number = 100,
  startPrice: number = 10
): number[] {
  const prices: number[] = [startPrice];

  for (let i = 1; i < days; i++) {
    const trend = (Math.random() - 0.48) * 0.001; // 轻微上升趋势
    const newPrice = generateMockPrice(prices[i - 1], 0.02, trend);
    prices.push(Math.max(newPrice, 0.1)); // 确保价格为正
  }

  return prices;
}

/**
 * 获取模拟股票行情
 */
export function getMockStockQuote(symbol: string): MockStockData | null {
  const stock = POPULAR_STOCKS.find((s) => s.symbol === symbol);
  if (!stock) return null;

  // 基础价格（根据股票代码生成一致的价格）
  const hash = symbol.split("").reduce((h, c) => h + c.charCodeAt(0), 0);
  const basePrice = 10 + (hash % 100);

  // 生成当前价格
  const currentPrice = generateMockPrice(basePrice, 0.02);
  const previousClose = basePrice;
  const changePercent = ((currentPrice - previousClose) / previousClose) * 100;

  // 生成日内高低价
  const high = currentPrice * (1 + Math.abs(Math.random() * 0.02));
  const low = currentPrice * (1 - Math.abs(Math.random() * 0.02));

  // 生成成交量
  const volume = Math.round((1000 + Math.random() * 5000) * 10000);

  return {
    symbol,
    name: stock.name,
    currentPrice: Math.round(currentPrice * 100) / 100,
    previousClose: Math.round(previousClose * 100) / 100,
    high: Math.round(high * 100) / 100,
    low: Math.round(low * 100) / 100,
    volume,
    changePercent: Math.round(changePercent * 100) / 100,
  };
}

/**
 * 获取所有热门股票的行情
 */
export function getAllMockStockQuotes(): MockStockData[] {
  return POPULAR_STOCKS
    .map((stock) => getMockStockQuote(stock.symbol))
    .filter((quote) => quote !== null) as MockStockData[];
}

/**
 * 获取股票列表
 */
export function getStockList() {
  return POPULAR_STOCKS.map((stock) => ({
    symbol: stock.symbol,
    name: stock.name,
    exchange: stock.symbol.endsWith(".SH") ? "SSE" : "SZSE",
  }));
}

/**
 * 模拟实时价格更新（WebSocket用）
 */
export function generatePriceUpdate(symbol: string): {
  symbol: string;
  price: number;
  timestamp: number;
  change: number;
  changePercent: number;
} {
  const quote = getMockStockQuote(symbol);
  if (!quote) {
    return {
      symbol,
      price: 0,
      timestamp: Date.now(),
      change: 0,
      changePercent: 0,
    };
  }

  const change = quote.currentPrice - quote.previousClose;
  return {
    symbol,
    price: quote.currentPrice,
    timestamp: Date.now(),
    change: Math.round(change * 100) / 100,
    changePercent: quote.changePercent,
  };
}

