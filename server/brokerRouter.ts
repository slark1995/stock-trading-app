import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { execSync } from "child_process";
import path from "path";

export const brokerRouter = router({
  login: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
        broker: z.enum(["openquant", "dongwu", "huatai"]).default("openquant"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const scriptPath = path.join(process.cwd(), "server", "broker-integration.py");

        const result = execSync(
          `python3 ${scriptPath} login ${input.username} ${input.password} ${input.broker}`,
          { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
        );

        const data = JSON.parse(result);

        if (data.success) {
          return {
            success: true,
            message: "登录成功",
          };
        } else {
          return {
            success: false,
            error: "登录失败，请检查用户名和密码",
          };
        }
      } catch (error) {
        console.error("登录错误:", error);
        return {
          success: false,
          error: "登录过程中出错，请确保已安装easytrader库",
        };
      }
    }),

  balance: publicProcedure.query(async () => {
    try {
      const scriptPath = path.join(process.cwd(), "server", "broker-integration.py");

      const result = execSync(
        `python3 ${scriptPath} balance`,
        { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
      );

      return JSON.parse(result);
    } catch (error) {
      console.error("获取余额错误:", error);
      return {
        total_assets: 0,
        available: 0,
        market_value: 0,
        frozen: 0,
      };
    }
  }),

  positions: publicProcedure.query(async () => {
    try {
      const scriptPath = path.join(process.cwd(), "server", "broker-integration.py");

      const result = execSync(
        `python3 ${scriptPath} positions`,
        { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
      );

      return JSON.parse(result);
    } catch (error) {
      console.error("获取持仓错误:", error);
      return [];
    }
  }),

  getPrice: publicProcedure
    .input(z.object({ symbol: z.string() }))
    .query(async ({ input }) => {
      try {
        const scriptPath = path.join(process.cwd(), "server", "broker-integration.py");

        const result = execSync(
          `python3 ${scriptPath} price ${input.symbol}`,
          { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
        );

        return JSON.parse(result);
      } catch (error) {
        console.error("获取价格错误:", error);
        return null;
      }
    }),

  logout: publicProcedure.mutation(async () => {
    try {
      return {
        success: true,
        message: "已登出",
      };
    } catch (error) {
      console.error("登出错误:", error);
      return {
        success: false,
        error: "登出失败",
      };
    }
  }),
});

