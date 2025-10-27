/**
 * 行情数据路由
 * 提供股票行情、K线数据等接口
 */

import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getMockStockQuote,
  getAllMockStockQuotes,
  getStockList,
  generateHistoricalPrices,
  generateDailyOHLCV,
} from "./mockMarketData";

export const marketRouter = router({
  /**
   * 获取单个股票行情
   */
  getQuote: publicProcedure
    .input(z.object({ symbol: z.string() }))
    .query(({ input }) => {
      const quote = getMockStockQuote(input.symbol);
      if (!quote) {
        throw new Error(`Stock ${input.symbol} not found`);
      }
      return quote;
    }),

  /**
   * 获取所有热门股票行情
   */
  getAllQuotes: publicProcedure.query(() => {
    return getAllMockStockQuotes();
  }),

  /**
   * 获取股票列表
   */
  getStockList: publicProcedure.query(() => {
    return getStockList();
  }),

  /**
   * 获取股票历史价格（用于技术指标计算）
   */
  getHistoricalPrices: publicProcedure
    .input(
      z.object({
        symbol: z.string(),
        days: z.number().optional().default(100),
      })
    )
    .query(({ input }) => {
      const prices = generateHistoricalPrices(input.symbol, input.days);
      return {
        symbol: input.symbol,
        prices,
        count: prices.length,
      };
    }),

  /**
   * 获取K线数据
   */
  getKlines: publicProcedure
    .input(
      z.object({
        symbol: z.string(),
        period: z.enum(["1m", "5m", "15m", "30m", "1h", "1d"]).optional().default("1d"),
        limit: z.number().optional().default(100),
      })
    )
    .query(({ input }) => {
      // 生成K线数据
      const klines = [];
      let basePrice = 10;

      for (let i = 0; i < input.limit; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (input.limit - i));

        const ohlcv = generateDailyOHLCV(input.symbol, date, basePrice);
        klines.push({
          time: date.toISOString().split("T")[0],
          ...ohlcv,
        });

        basePrice = ohlcv.close;
      }

      return {
        symbol: input.symbol,
        period: input.period,
        klines,
      };
    }),

  /**
   * 搜索股票
   */
  searchStocks: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(({ input }) => {
      const stocks = getStockList();
      const query = input.query.toLowerCase();

      return stocks.filter(
        (stock) =>
          stock.symbol.toLowerCase().includes(query) ||
          stock.name.toLowerCase().includes(query)
      );
    }),
});

