/**
 * 交易模拟引擎
 * 处理策略执行、交易模拟、持仓管理等核心逻辑
 */

import type { Strategy, Position, Account } from '../drizzle/schema';
import { calculateAllIndicators, generateTradeSignal, type IndicatorResult } from './indicators';

export interface MarketSnapshot {
  symbol: string;
  price: number;
  high: number;
  low: number;
  volume: number;
  timestamp: Date;
}

export interface StrategyRules {
  indicators?: {
    ma5?: boolean;
    ma10?: boolean;
    ma20?: boolean;
    rsi14?: boolean;
    macd?: boolean;
    bollingerBands?: boolean;
  };
  buyConditions?: string[]; // 自定义买入条件
  sellConditions?: string[]; // 自定义卖出条件
  stopLoss?: number; // 止损百分比
  takeProfit?: number; // 止盈百分比
  maxPositionSize?: number; // 最大持仓数量
}

export interface TradeDecision {
  action: 'BUY' | 'SELL' | 'HOLD';
  quantity?: number;
  reason: string;
  confidence: number; // 0-100
}

/**
 * 解析策略规则JSON
 */
export function parseStrategyRules(rulesJson: string): StrategyRules {
  try {
    return JSON.parse(rulesJson);
  } catch (error) {
    console.error('Failed to parse strategy rules:', error);
    return {};
  }
}

/**
 * 根据策略和市场数据生成交易决策
 */
export function makeTradeDecision(
  strategy: Strategy,
  marketSnapshot: MarketSnapshot,
  historicalPrices: number[],
  currentPosition: Position | null,
  account: Account
): TradeDecision {
  const rules = parseStrategyRules(strategy.rules);

  // 如果是技术指标策略
  if (strategy.strategyType === 'technical') {
    return makeTechnicalTradeDecision(
      marketSnapshot,
      historicalPrices,
      currentPosition,
      account,
      rules
    );
  }

  // 如果是自定义策略
  if (strategy.strategyType === 'custom') {
    return makeCustomTradeDecision(
      marketSnapshot,
      currentPosition,
      account,
      rules
    );
  }

  return {
    action: 'HOLD',
    reason: 'Unknown strategy type',
    confidence: 0,
  };
}

/**
 * 技术指标交易决策
 */
function makeTechnicalTradeDecision(
  marketSnapshot: MarketSnapshot,
  historicalPrices: number[],
  currentPosition: Position | null,
  account: Account,
  rules: StrategyRules
): TradeDecision {
  if (historicalPrices.length < 26) {
    return {
      action: 'HOLD',
      reason: 'Insufficient historical data',
      confidence: 0,
    };
  }

  // 计算技术指标
  const indicators = calculateAllIndicators(
    historicalPrices,
    historicalPrices.map((p) => p * 1.02), // 简化：假设高点为收盘价的1.02倍
    historicalPrices.map((p) => p * 0.98)  // 简化：假设低点为收盘价的0.98倍
  );

  // 生成交易信号
  const signal = generateTradeSignal(indicators, marketSnapshot.price);

  // 检查止损条件
  if (currentPosition && rules.stopLoss) {
    const costPrice = currentPosition.costPrice / 10000;
    const currentPrice = marketSnapshot.price;
    const lossPercent = ((costPrice - currentPrice) / costPrice) * 100;

    if (lossPercent >= rules.stopLoss) {
      return {
        action: 'SELL',
        quantity: currentPosition.quantity,
        reason: `Stop loss triggered: ${lossPercent.toFixed(2)}% loss`,
        confidence: 100,
      };
    }
  }

  // 检查止盈条件
  if (currentPosition && rules.takeProfit) {
    const costPrice = currentPosition.costPrice / 10000;
    const currentPrice = marketSnapshot.price;
    const profitPercent = ((currentPrice - costPrice) / costPrice) * 100;

    if (profitPercent >= rules.takeProfit) {
      return {
        action: 'SELL',
        quantity: currentPosition.quantity,
        reason: `Take profit triggered: ${profitPercent.toFixed(2)}% gain`,
        confidence: 100,
      };
    }
  }

  // 根据信号生成交易决策
  if (signal.type === 'BUY' && !currentPosition) {
    // 计算可以购买的数量
    const availableFunds = account.currentBalance / 10000; // 转换为实际金额
    const maxQuantity = Math.floor(availableFunds / marketSnapshot.price);
    const maxPositionSize = rules.maxPositionSize || maxQuantity;
    const quantity = Math.min(maxQuantity, maxPositionSize);

    if (quantity > 0) {
      return {
        action: 'BUY',
        quantity,
        reason: `Buy signal: ${signal.reasons.join(', ')}`,
        confidence: signal.strength,
      };
    }
  }

  if (signal.type === 'SELL' && currentPosition) {
    return {
      action: 'SELL',
      quantity: currentPosition.quantity,
      reason: `Sell signal: ${signal.reasons.join(', ')}`,
      confidence: signal.strength,
    };
  }

  return {
    action: 'HOLD',
    reason: 'No clear signal',
    confidence: 0,
  };
}

/**
 * 自定义策略交易决策
 */
function makeCustomTradeDecision(
  marketSnapshot: MarketSnapshot,
  currentPosition: Position | null,
  account: Account,
  rules: StrategyRules
): TradeDecision {
  // 简单的自定义策略实现
  // 可以根据用户定义的条件生成交易决策

  if (rules.buyConditions && rules.buyConditions.length > 0 && !currentPosition) {
    // 这里可以实现更复杂的条件评估
    const availableFunds = account.currentBalance / 10000;
    const maxQuantity = Math.floor(availableFunds / marketSnapshot.price);
    const quantity = Math.min(maxQuantity, rules.maxPositionSize || maxQuantity);

    if (quantity > 0) {
      return {
        action: 'BUY',
        quantity,
        reason: 'Custom buy condition met',
        confidence: 50,
      };
    }
  }

  if (rules.sellConditions && rules.sellConditions.length > 0 && currentPosition) {
    return {
      action: 'SELL',
      quantity: currentPosition.quantity,
      reason: 'Custom sell condition met',
      confidence: 50,
    };
  }

  return {
    action: 'HOLD',
    reason: 'No custom condition triggered',
    confidence: 0,
  };
}

/**
 * 执行交易
 */
export interface TradeExecution {
  success: boolean;
  message: string;
  newBalance?: number;
  newPosition?: Position;
}

export function executeTradeSimulation(
  decision: TradeDecision,
  marketSnapshot: MarketSnapshot,
  account: Account,
  currentPosition: Position | null
): TradeExecution {
  if (decision.action === 'HOLD') {
    return {
      success: true,
      message: 'No trade executed',
    };
  }

  const tradeValue = (decision.quantity || 0) * marketSnapshot.price * 10000; // 转换为整数存储

  if (decision.action === 'BUY') {
    if (account.currentBalance < tradeValue) {
      return {
        success: false,
        message: 'Insufficient funds',
      };
    }

    const newBalance = account.currentBalance - tradeValue;
    const newPosition: Position = {
      id: 0, // 占位符
      userId: account.userId,
      symbol: marketSnapshot.symbol,
      quantity: decision.quantity || 0,
      costPrice: Math.round(marketSnapshot.price * 10000),
      currentPrice: Math.round(marketSnapshot.price * 10000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      success: true,
      message: `Bought ${decision.quantity} shares at ${marketSnapshot.price}`,
      newBalance,
      newPosition,
    };
  }

  if (decision.action === 'SELL' && currentPosition) {
    const newBalance = account.currentBalance + tradeValue;
    return {
      success: true,
      message: `Sold ${decision.quantity} shares at ${marketSnapshot.price}`,
      newBalance,
    };
  }

  return {
    success: false,
    message: 'Invalid trade decision',
  };
}

/**
 * 计算持仓收益
 */
export interface PositionMetrics {
  currentValue: number; // 当前价值
  costValue: number; // 成本价值
  profit: number; // 绝对盈亏
  profitPercent: number; // 盈亏百分比
  roi: number; // 投资回报率
}

export function calculatePositionMetrics(
  position: Position,
  currentPrice: number
): PositionMetrics {
  const costPrice = position.costPrice / 10000;
  const costValue = costPrice * position.quantity;
  const currentValue = currentPrice * position.quantity;
  const profit = currentValue - costValue;
  const profitPercent = (profit / costValue) * 100;
  const roi = (profit / costValue) * 100;

  return {
    currentValue,
    costValue,
    profit,
    profitPercent,
    roi,
  };
}

/**
 * 计算账户总体收益
 */
export interface AccountMetrics {
  totalAssets: number;
  totalCost: number;
  totalProfit: number;
  totalProfitPercent: number;
  cashBalance: number;
  positionValue: number;
}

export function calculateAccountMetrics(
  account: Account,
  positions: Position[],
  currentPrices: Map<string, number>
): AccountMetrics {
  let totalCost = 0;
  let positionValue = 0;

  for (const position of positions) {
    const costPrice = position.costPrice / 10000;
    const currentPrice = currentPrices.get(position.symbol) || costPrice;

    totalCost += costPrice * position.quantity;
    positionValue += currentPrice * position.quantity;
  }

  const cashBalance = account.currentBalance / 10000;
  const totalAssets = cashBalance + positionValue;
  const totalProfit = totalAssets - (account.initialBalance / 10000);
  const totalProfitPercent = (totalProfit / (account.initialBalance / 10000)) * 100;

  return {
    totalAssets,
    totalCost,
    totalProfit,
    totalProfitPercent,
    cashBalance,
    positionValue,
  };
}

