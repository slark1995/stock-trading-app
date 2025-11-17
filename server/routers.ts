import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getOrCreateAccount,
  getUserStrategies,
  getUserPositions,
  getUserTrades,
  createStrategy,
  updateStrategy,
  recordTrade,
} from "./db";
import { marketRouter } from "./marketRouter";
import { liveTradeRouter } from "./liveTradeRouter";
import { testLoginRouter } from "./testLoginRouter";

export const appRouter = router({
  system: systemRouter,

  // 测试登录路由
  testAuth: testLoginRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // 行情数据路由
  market: marketRouter,

  // 实盘交易路由
  liveTrade: liveTradeRouter,

  // 交易相关路由
  trading: router({
    /**
     * 获取或创建用户账户
     */
    getAccount: protectedProcedure
      .input(z.object({ initialBalance: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const account = await getOrCreateAccount(
          ctx.user.id,
          input?.initialBalance || 100000000 // 默认100万
        );
        return account;
      }),

    /**
     * 获取用户的所有策略
     */
    getStrategies: protectedProcedure.query(async ({ ctx }) => {
      return await getUserStrategies(ctx.user.id);
    }),

    /**
     * 创建新策略
     */
    createStrategy: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          strategyType: z.enum(["technical", "custom"]),
          rules: z.string(), // JSON string
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await createStrategy(ctx.user.id, {
          name: input.name,
          description: input.description,
          strategyType: input.strategyType,
          rules: input.rules,
          isActive: 0,
        });
      }),

    /**
     * 更新策略
     */
    updateStrategy: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          rules: z.string().optional(),
          isActive: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await updateStrategy(input.id, {
          name: input.name,
          description: input.description,
          rules: input.rules,
          isActive: input.isActive,
        });
      }),

    /**
     * 获取用户持仓
     */
    getPositions: protectedProcedure.query(async ({ ctx }) => {
      return await getUserPositions(ctx.user.id);
    }),

    /**
     * 获取交易记录
     */
    getTrades: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return await getUserTrades(ctx.user.id, input?.limit || 100);
      }),

    /**
     * 模拟交易（买入）
     */
    simulateBuy: protectedProcedure
      .input(
        z.object({
          symbol: z.string(),
          quantity: z.number(),
          price: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const trade = await recordTrade(ctx.user.id, {
          symbol: input.symbol,
          action: "BUY",
          quantity: input.quantity,
          price: Math.round(input.price * 10000),
          executedAt: new Date(),
        });
        return trade;
      }),

    /**
     * 模拟交易（卖出）
     */
    simulateSell: protectedProcedure
      .input(
        z.object({
          symbol: z.string(),
          quantity: z.number(),
          price: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const trade = await recordTrade(ctx.user.id, {
          symbol: input.symbol,
          action: "SELL",
          quantity: input.quantity,
          price: Math.round(input.price * 10000),
          executedAt: new Date(),
        });
        return trade;
      }),
  }),
});

export type AppRouter = typeof appRouter;

