/**
 * 策略执行服务
 * 定期检查策略条件，生成交易信号，执行交易
 */

import type { Strategy, Account, Position } from "../drizzle/schema";
import { makeTradeDecision, type MarketSnapshot, executeTradeSimulation } from "./tradingEngine";
import { getMockStockQuote, generateHistoricalPrices } from "./mockMarketData";
import {
  getOrCreateAccount,
  getUserPositions,
  recordTrade,
  updatePosition,
} from "./db";

export interface ExecutionResult {
  strategyId: number;
  symbol: string;
  decision: string;
  executed: boolean;
  message: string;
  tradeId?: number;
}

/**
 * 为策略执行生成市场快照
 */
function createMarketSnapshot(symbol: string): MarketSnapshot | null {
  const quote = getMockStockQuote(symbol);
  if (!quote) return null;

  return {
    symbol,
    price: quote.currentPrice,
    high: quote.high,
    low: quote.low,
    volume: quote.volume,
    timestamp: new Date(),
  };
}

/**
 * 执行单个策略
 */
export async function executeStrategy(
  strategy: Strategy,
  userId: number
): Promise<ExecutionResult[]> {
  const results: ExecutionResult[] = [];

  // 获取用户账户
  const account = await getOrCreateAccount(userId);
  if (!account) {
    return [
      {
        strategyId: strategy.id,
        symbol: "N/A",
        decision: "ERROR",
        executed: false,
        message: "Failed to get account",
      },
    ];
  }

  // 获取用户持仓
  const positions = await getUserPositions(userId);

  // 解析策略规则以获取目标股票
  try {
    const rules = JSON.parse(strategy.rules);
    const symbols = extractSymbolsFromRules(rules);

    for (const symbol of symbols) {
      const result = await executeStrategyForSymbol(
        strategy,
        symbol,
        userId,
        account,
        positions
      );
      results.push(result);
    }
  } catch (error) {
    console.error("Failed to parse strategy rules:", error);
    results.push({
      strategyId: strategy.id,
      symbol: "N/A",
      decision: "ERROR",
      executed: false,
      message: "Invalid strategy rules",
    });
  }

  return results;
}

/**
 * 为特定股票执行策略
 */
async function executeStrategyForSymbol(
  strategy: Strategy,
  symbol: string,
  userId: number,
  account: any,
  positions: Position[]
): Promise<ExecutionResult> {
  try {
    // 创建市场快照
    const marketSnapshot = createMarketSnapshot(symbol);
    if (!marketSnapshot) {
      return {
        strategyId: strategy.id,
        symbol,
        decision: "HOLD",
        executed: false,
        message: "Failed to get market data",
      };
    }

    // 生成历史价格数据
    const historicalPrices = generateHistoricalPrices(symbol, 100);

    // 查找该股票的持仓
    const currentPosition = positions.find((p) => p.symbol === symbol) || null;

    // 生成交易决策
    const decision = makeTradeDecision(
      strategy,
      marketSnapshot,
      historicalPrices,
      currentPosition,
      account
    );

    // 如果没有交易信号，返回HOLD
    if (decision.action === "HOLD") {
      return {
        strategyId: strategy.id,
        symbol,
        decision: "HOLD",
        executed: false,
        message: decision.reason,
      };
    }

    // 执行交易模拟
    const execution = executeTradeSimulation(
      decision,
      marketSnapshot,
      account,
      currentPosition
    );

    if (!execution.success) {
      return {
        strategyId: strategy.id,
        symbol,
        decision: decision.action,
        executed: false,
        message: execution.message,
      };
    }

    // 记录交易
    const trade = await recordTrade(userId, {
      symbol,
      action: decision.action,
      quantity: decision.quantity || 0,
      price: Math.round(marketSnapshot.price * 10000),
      executedAt: new Date(),
    });

    // 更新持仓
    if (decision.action === "BUY" && execution.newPosition) {
      await updatePosition(
        userId,
        symbol,
        execution.newPosition.quantity,
        Math.round(marketSnapshot.price * 10000)
      );
    } else if (decision.action === "SELL" && currentPosition) {
      const newQuantity = currentPosition.quantity - (decision.quantity || 0);
      if (newQuantity > 0) {
        await updatePosition(
          userId,
          symbol,
          newQuantity,
          Math.round(marketSnapshot.price * 10000)
        );
      } else {
        // 删除持仓
        await updatePosition(userId, symbol, 0, Math.round(marketSnapshot.price * 10000));
      }
    }

    return {
      strategyId: strategy.id,
      symbol,
      decision: decision.action,
      executed: true,
      message: execution.message,
      tradeId: trade?.id,
    };
  } catch (error) {
    console.error("Error executing strategy for symbol:", error);
    return {
      strategyId: strategy.id,
      symbol,
      decision: "ERROR",
      executed: false,
      message: `Execution error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * 从策略规则中提取股票代码
 */
function extractSymbolsFromRules(rules: any): string[] {
  const symbols: Set<string> = new Set();

  // 如果规则中有明确的symbols字段
  if (rules.symbols && Array.isArray(rules.symbols)) {
    rules.symbols.forEach((s: string) => symbols.add(s));
  }

  // 如果没有指定，使用一些热门股票作为默认
  if (symbols.size === 0) {
    const defaultSymbols = [
      "600000.SH",
      "600519.SH",
      "000001.SZ",
      "000858.SZ",
      "300750.SZ",
    ];
    defaultSymbols.forEach((s) => symbols.add(s));
  }

  return Array.from(symbols);
}

/**
 * 批量执行所有活跃策略
 */
export async function executeAllActiveStrategies(
  strategies: Strategy[],
  userId: number
): Promise<ExecutionResult[]> {
  const allResults: ExecutionResult[] = [];

  for (const strategy of strategies) {
    if (strategy.isActive) {
      const results = await executeStrategy(strategy, userId);
      allResults.push(...results);
    }
  }

  return allResults;
}

/**
 * 定时执行策略（用于定时任务）
 */
export async function scheduleStrategyExecution(
  strategies: Strategy[],
  userId: number,
  intervalMinutes: number = 5
) {
  const executeOnce = async () => {
    console.log(`[${new Date().toISOString()}] Executing strategies for user ${userId}`);
    try {
      const results = await executeAllActiveStrategies(strategies, userId);
      const executedCount = results.filter((r) => r.executed).length;
      console.log(
        `[${new Date().toISOString()}] Strategy execution completed. ${executedCount} trades executed.`
      );
      return results;
    } catch (error) {
      console.error("Error in scheduled strategy execution:", error);
      return [];
    }
  };

  // 立即执行一次
  await executeOnce();

  // 定时执行
  const intervalId = setInterval(executeOnce, intervalMinutes * 60 * 1000);

  return () => clearInterval(intervalId);
}

