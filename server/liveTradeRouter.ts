/**
 * 实盘交易路由
 * 提供实盘交易相关的API接口
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  createBrokerAdapter,
  brokerManager,
  type BrokerConfig,
  type OrderRequest,
} from "./brokerIntegration";

export const liveTradeRouter = router({
  /**
   * 配置券商连接
   */
  configureBroker: protectedProcedure
    .input(
      z.object({
        brokerType: z.enum(["easytrader", "qmt", "ctp", "mock"]),
        apiKey: z.string().optional(),
        apiSecret: z.string().optional(),
        accountId: z.string().optional(),
        customConfig: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const config: BrokerConfig = {
          type: input.brokerType,
          apiKey: input.apiKey,
          apiSecret: input.apiSecret,
          accountId: input.accountId,
          customConfig: input.customConfig,
        };

        const adapter = createBrokerAdapter(config);
        const brokerName = `${input.brokerType}_${ctx.user.id}`;
        brokerManager.addBroker(brokerName, adapter);

        const connected = await adapter.connect();

        return {
          success: connected,
          brokerName,
          message: connected ? "Broker connected successfully" : "Failed to connect broker",
        };
      } catch (error) {
        return {
          success: false,
          brokerName: "",
          message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    }),

  /**
   * 检查券商连接状态
   */
  checkBrokerStatus: protectedProcedure
    .input(z.object({ brokerName: z.string().optional() }))
    .query(({ input, ctx }) => {
      const name = input.brokerName || `mock_${ctx.user.id}`;
      const broker = brokerManager.getBroker(name);

      return {
        connected: broker?.isConnected() || false,
        brokerName: name,
      };
    }),

  /**
   * 获取券商账户信息
   */
  getBrokerAccount: protectedProcedure
    .input(z.object({ brokerName: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      try {
        const name = input.brokerName || `mock_${ctx.user.id}`;
        const broker = brokerManager.getBroker(name);

        if (!broker || !broker.isConnected()) {
          throw new Error("Broker not connected");
        }

        const accountInfo = await broker.getAccountInfo();
        return {
          success: true,
          data: accountInfo,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * 下单（实盘交易）
   */
  placeOrder: protectedProcedure
    .input(
      z.object({
        symbol: z.string(),
        action: z.enum(["BUY", "SELL"]),
        quantity: z.number().positive(),
        price: z.number().optional(),
        orderType: z.enum(["MARKET", "LIMIT"]).optional(),
        brokerName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const brokerName = input.brokerName || `mock_${ctx.user.id}`;
        const broker = brokerManager.getBroker(brokerName);

        if (!broker || !broker.isConnected()) {
          throw new Error("Broker not connected");
        }

        const orderRequest: OrderRequest = {
          symbol: input.symbol,
          action: input.action,
          quantity: input.quantity,
          price: input.price,
          orderType: input.orderType || "MARKET",
        };

        const response = await broker.placeOrder(orderRequest);

        return {
          success: response.status !== "REJECTED",
          data: response,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * 查询订单状态
   */
  getOrderStatus: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        brokerName: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const brokerName = input.brokerName || `mock_${ctx.user.id}`;
        const broker = brokerManager.getBroker(brokerName);

        if (!broker) {
          throw new Error("Broker not found");
        }

        const status = await broker.getOrderStatus(input.orderId);

        return {
          success: true,
          orderId: input.orderId,
          status,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * 取消订单
   */
  cancelOrder: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        brokerName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const brokerName = input.brokerName || `mock_${ctx.user.id}`;
        const broker = brokerManager.getBroker(brokerName);

        if (!broker) {
          throw new Error("Broker not found");
        }

        const cancelled = await broker.cancelOrder(input.orderId);

        return {
          success: cancelled,
          orderId: input.orderId,
          message: cancelled ? "Order cancelled successfully" : "Failed to cancel order",
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * 获取券商持仓
   */
  getBrokerPositions: protectedProcedure
    .input(z.object({ brokerName: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      try {
        const brokerName = input.brokerName || `mock_${ctx.user.id}`;
        const broker = brokerManager.getBroker(brokerName);

        if (!broker || !broker.isConnected()) {
          throw new Error("Broker not connected");
        }

        const positions = await broker.getPositions();

        return {
          success: true,
          data: positions,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  /**
   * 获取支持的券商列表
   */
  getSupportedBrokers: protectedProcedure.query(() => {
    return [
      {
        type: "easytrader",
        name: "EasyTrader（同花顺）",
        description: "通过同花顺客户端进行交易，支持大部分券商",
        requiresLocalService: true,
        requiredFields: ["apiKey"],
      },
      {
        type: "qmt",
        name: "同花顺QMT",
        description: "官方量化交易平台，相对稳定",
        requiresLocalService: false,
        requiredFields: ["apiKey", "apiSecret", "accountId"],
      },
      {
        type: "ctp",
        name: "CTP（期货）",
        description: "中信期货CTP接口，支持期货交易",
        requiresLocalService: true,
        requiredFields: ["apiKey", "apiSecret"],
      },
      {
        type: "mock",
        name: "模拟交易",
        description: "本地模拟交易，用于测试和演示",
        requiresLocalService: false,
        requiredFields: [],
      },
    ];
  }),

  /**
   * 获取券商集成文档
   */
  getBrokerIntegrationGuide: protectedProcedure
    .input(z.object({ brokerType: z.enum(["easytrader", "qmt", "ctp"]) }))
    .query(({ input }) => {
      const guides: Record<string, any> = {
        easytrader: {
          title: "EasyTrader 集成指南",
          steps: [
            "1. 安装同花顺客户端",
            "2. 在本地运行 easytrader 服务（pip install easytrader）",
            "3. 启动 easytrader 服务器（python -m easytrader.server）",
            "4. 在应用中配置 easytrader 连接",
            "5. 输入账户和密码进行登录",
          ],
          documentation: "https://github.com/shidenggui/easytrader",
          notes: [
            "需要本地运行同花顺客户端",
            "支持大部分券商",
            "相对稳定，推荐使用",
          ],
        },
        qmt: {
          title: "同花顺QMT 集成指南",
          steps: [
            "1. 在同花顺官网开通QMT服务（需要付费）",
            "2. 获取 API Key 和 Secret",
            "3. 在应用中配置 QMT 连接",
            "4. 输入账户信息进行登录",
          ],
          documentation: "https://www.ths.com.cn/",
          notes: [
            "需要开通QMT服务（付费）",
            "官方平台，相对稳定",
            "支持更多交易品种",
          ],
        },
        ctp: {
          title: "CTP 集成指南",
          steps: [
            "1. 联系期货公司获取 CTP 接口权限",
            "2. 获取 API Key 和 Secret",
            "3. 配置 CTP 服务器地址",
            "4. 在应用中配置 CTP 连接",
          ],
          documentation: "https://www.sfit.com.cn/",
          notes: [
            "主要用于期货交易",
            "需要期货账户",
            "需要企业资质",
          ],
        },
      };

      return guides[input.brokerType] || null;
    }),
});

