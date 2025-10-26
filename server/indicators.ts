/**
 * 技术指标计算模块
 * 用于计算常用的技术指标：MA、MACD、RSI、Bollinger Bands等
 */

export interface PriceData {
  close: number;
  high: number;
  low: number;
  volume: number;
}

export interface IndicatorResult {
  ma5?: number;
  ma10?: number;
  ma20?: number;
  rsi14?: number;
  macd?: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollingerBands?: {
    upper: number;
    middle: number;
    lower: number;
  };
}

/**
 * 计算简单移动平均线 (SMA)
 */
export function calculateSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
}

/**
 * 计算指数移动平均线 (EMA)
 */
export function calculateEMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;

  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * multiplier + ema * (1 - multiplier);
  }

  return ema;
}

/**
 * 计算相对强弱指数 (RSI)
 */
export function calculateRSI(prices: number[], period: number = 14): number | null {
  if (prices.length < period + 1) return null;

  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  let gains = 0;
  let losses = 0;

  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) {
      gains += changes[i];
    } else {
      losses += Math.abs(changes[i]);
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  return rsi;
}

/**
 * 计算MACD指标
 */
export function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } | null {
  if (prices.length < 26) return null;

  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);

  if (ema12 === null || ema26 === null) return null;

  const macd = ema12 - ema26;

  // Calculate signal line (9-period EMA of MACD)
  const macdValues: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    const e12 = calculateEMA(prices.slice(0, i + 1), 12);
    const e26 = calculateEMA(prices.slice(0, i + 1), 26);
    if (e12 !== null && e26 !== null) {
      macdValues.push(e12 - e26);
    }
  }

  const signal = calculateEMA(macdValues, 9) || 0;
  const histogram = macd - signal;

  return { macd, signal, histogram };
}

/**
 * 计算布林带 (Bollinger Bands)
 */
export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): { upper: number; middle: number; lower: number } | null {
  if (prices.length < period) return null;

  const middle = calculateSMA(prices, period);
  if (middle === null) return null;

  const recentPrices = prices.slice(-period);
  const variance =
    recentPrices.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  const upper = middle + stdDev * stdDevMultiplier;
  const lower = middle - stdDev * stdDevMultiplier;

  return { upper, middle, lower };
}

/**
 * 计算所有主要指标
 */
export function calculateAllIndicators(
  closePrices: number[],
  highPrices: number[],
  lowPrices: number[]
): IndicatorResult {
  const result: IndicatorResult = {};

  // 移动平均线
  result.ma5 = calculateSMA(closePrices, 5) || undefined;
  result.ma10 = calculateSMA(closePrices, 10) || undefined;
  result.ma20 = calculateSMA(closePrices, 20) || undefined;

  // RSI
  result.rsi14 = calculateRSI(closePrices, 14) || undefined;

  // MACD
  const macd = calculateMACD(closePrices);
  if (macd) {
    result.macd = macd;
  }

  // 布林带
  const bb = calculateBollingerBands(closePrices, 20, 2);
  if (bb) {
    result.bollingerBands = bb;
  }

  return result;
}

/**
 * 生成交易信号
 */
export interface TradeSignal {
  type: 'BUY' | 'SELL' | 'HOLD';
  strength: number; // 0-100, 信号强度
  reasons: string[];
}

export function generateTradeSignal(indicators: IndicatorResult, currentPrice: number): TradeSignal {
  const reasons: string[] = [];
  let buyScore = 0;
  let sellScore = 0;

  // MA策略：价格在MA5上方且MA5在MA20上方
  if (indicators.ma5 && indicators.ma20) {
    if (currentPrice > indicators.ma5 && indicators.ma5 > indicators.ma20) {
      buyScore += 20;
      reasons.push('Price above MA5, MA5 above MA20');
    } else if (currentPrice < indicators.ma5 && indicators.ma5 < indicators.ma20) {
      sellScore += 20;
      reasons.push('Price below MA5, MA5 below MA20');
    }
  }

  // RSI策略
  if (indicators.rsi14) {
    if (indicators.rsi14 < 30) {
      buyScore += 15;
      reasons.push('RSI oversold (< 30)');
    } else if (indicators.rsi14 > 70) {
      sellScore += 15;
      reasons.push('RSI overbought (> 70)');
    }
  }

  // MACD策略
  if (indicators.macd) {
    if (indicators.macd.macd > indicators.macd.signal && indicators.macd.histogram > 0) {
      buyScore += 25;
      reasons.push('MACD bullish crossover');
    } else if (indicators.macd.macd < indicators.macd.signal && indicators.macd.histogram < 0) {
      sellScore += 25;
      reasons.push('MACD bearish crossover');
    }
  }

  // 布林带策略
  if (indicators.bollingerBands) {
    if (currentPrice < indicators.bollingerBands.lower) {
      buyScore += 15;
      reasons.push('Price below lower Bollinger Band');
    } else if (currentPrice > indicators.bollingerBands.upper) {
      sellScore += 15;
      reasons.push('Price above upper Bollinger Band');
    }
  }

  let type: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let strength = 0;

  if (buyScore > sellScore && buyScore >= 40) {
    type = 'BUY';
    strength = Math.min(100, buyScore);
  } else if (sellScore > buyScore && sellScore >= 40) {
    type = 'SELL';
    strength = Math.min(100, sellScore);
  }

  return { type, strength, reasons };
}

