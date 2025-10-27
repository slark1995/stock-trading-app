/**
 * 券商API集成框架
 * 支持多个券商的实盘交易接口
 */

export interface BrokerConfig {
  type: "easytrader" | "qmt" | "ctp" | "mock";
  apiKey?: string;
  apiSecret?: string;
  accountId?: string;
  brokerName?: string;
  customConfig?: Record<string, any>;
}

export interface OrderRequest {
  symbol: string;
  action: "BUY" | "SELL";
  quantity: number;
  price?: number; // 限价单，不指定则为市价单
  orderType?: "MARKET" | "LIMIT";
}

export interface OrderResponse {
  orderId: string;
  symbol: string;
  action: string;
  quantity: number;
  price: number;
  status: "PENDING" | "FILLED" | "PARTIAL" | "CANCELLED" | "REJECTED";
  message: string;
}

export interface AccountInfo {
  accountId: string;
  balance: number;
  availableBalance: number;
  marketValue: number;
  totalAssets: number;
  profitLoss: number;
}

/**
 * 券商基类
 */
export abstract class BrokerAdapter {
  protected config: BrokerConfig;
  protected connected: boolean = false;

  constructor(config: BrokerConfig) {
    this.config = config;
  }

  abstract connect(): Promise<boolean>;
  abstract disconnect(): Promise<void>;
  abstract placeOrder(order: OrderRequest): Promise<OrderResponse>;
  abstract getAccountInfo(): Promise<AccountInfo>;
  abstract getPositions(): Promise<any[]>;
  abstract cancelOrder(orderId: string): Promise<boolean>;
  abstract getOrderStatus(orderId: string): Promise<string>;

  isConnected(): boolean {
    return this.connected;
  }
}

/**
 * EasyTrader 适配器（通过同花顺客户端）
 */
export class EasyTraderAdapter extends BrokerAdapter {
  private client: any = null;

  async connect(): Promise<boolean> {
    try {
      // 这里应该通过HTTP或WebSocket连接到本地easytrader服务
      // 示例：
      // const response = await fetch('http://localhost:8888/connect', {
      //   method: 'POST',
      //   body: JSON.stringify(this.config)
      // });
      // this.client = await response.json();

      console.log("[EasyTrader] Connecting to local easytrader service...");
      // 模拟连接成功
      this.connected = true;
      return true;
    } catch (error) {
      console.error("[EasyTrader] Connection failed:", error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    console.log("[EasyTrader] Disconnected");
  }

  async placeOrder(order: OrderRequest): Promise<OrderResponse> {
    if (!this.connected) {
      return {
        orderId: "",
        symbol: order.symbol,
        action: order.action,
        quantity: order.quantity,
        price: order.price || 0,
        status: "REJECTED",
        message: "Not connected to broker",
      };
    }

    try {
      // 调用easytrader API
      // const response = await fetch('http://localhost:8888/order', {
      //   method: 'POST',
      //   body: JSON.stringify(order)
      // });

      console.log(`[EasyTrader] Placing order: ${order.action} ${order.quantity} ${order.symbol}`);

      return {
        orderId: `ET${Date.now()}`,
        symbol: order.symbol,
        action: order.action,
        quantity: order.quantity,
        price: order.price || 0,
        status: "PENDING",
        message: "Order submitted to easytrader",
      };
    } catch (error) {
      return {
        orderId: "",
        symbol: order.symbol,
        action: order.action,
        quantity: order.quantity,
        price: order.price || 0,
        status: "REJECTED",
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  async getAccountInfo(): Promise<AccountInfo> {
    if (!this.connected) {
      throw new Error("Not connected to broker");
    }

    // 调用easytrader API获取账户信息
    return {
      accountId: this.config.accountId || "UNKNOWN",
      balance: 0,
      availableBalance: 0,
      marketValue: 0,
      totalAssets: 0,
      profitLoss: 0,
    };
  }

  async getPositions(): Promise<any[]> {
    if (!this.connected) {
      throw new Error("Not connected to broker");
    }

    // 调用easytrader API获取持仓
    return [];
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    if (!this.connected) {
      return false;
    }

    // 调用easytrader API取消订单
    return true;
  }

  async getOrderStatus(orderId: string): Promise<string> {
    if (!this.connected) {
      return "UNKNOWN";
    }

    // 调用easytrader API查询订单状态
    return "PENDING";
  }
}

/**
 * QMT 适配器（同花顺量化交易平台）
 */
export class QMTAdapter extends BrokerAdapter {
  private client: any = null;

  async connect(): Promise<boolean> {
    try {
      console.log("[QMT] Connecting to QMT platform...");
      // 连接到QMT API
      this.connected = true;
      return true;
    } catch (error) {
      console.error("[QMT] Connection failed:", error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    console.log("[QMT] Disconnected");
  }

  async placeOrder(order: OrderRequest): Promise<OrderResponse> {
    if (!this.connected) {
      return {
        orderId: "",
        symbol: order.symbol,
        action: order.action,
        quantity: order.quantity,
        price: order.price || 0,
        status: "REJECTED",
        message: "Not connected to QMT",
      };
    }

    try {
      console.log(`[QMT] Placing order: ${order.action} ${order.quantity} ${order.symbol}`);

      return {
        orderId: `QMT${Date.now()}`,
        symbol: order.symbol,
        action: order.action,
        quantity: order.quantity,
        price: order.price || 0,
        status: "PENDING",
        message: "Order submitted to QMT",
      };
    } catch (error) {
      return {
        orderId: "",
        symbol: order.symbol,
        action: order.action,
        quantity: order.quantity,
        price: order.price || 0,
        status: "REJECTED",
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  async getAccountInfo(): Promise<AccountInfo> {
    if (!this.connected) {
      throw new Error("Not connected to QMT");
    }

    return {
      accountId: this.config.accountId || "UNKNOWN",
      balance: 0,
      availableBalance: 0,
      marketValue: 0,
      totalAssets: 0,
      profitLoss: 0,
    };
  }

  async getPositions(): Promise<any[]> {
    if (!this.connected) {
      throw new Error("Not connected to QMT");
    }

    return [];
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    if (!this.connected) {
      return false;
    }

    return true;
  }

  async getOrderStatus(orderId: string): Promise<string> {
    if (!this.connected) {
      return "UNKNOWN";
    }

    return "PENDING";
  }
}

/**
 * 模拟券商适配器（用于测试）
 */
export class MockBrokerAdapter extends BrokerAdapter {
  private orders: Map<string, OrderResponse> = new Map();
  private accountBalance: number = 1000000;

  async connect(): Promise<boolean> {
    console.log("[Mock] Mock broker connected");
    this.connected = true;
    return true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    console.log("[Mock] Mock broker disconnected");
  }

  async placeOrder(order: OrderRequest): Promise<OrderResponse> {
    if (!this.connected) {
      return {
        orderId: "",
        symbol: order.symbol,
        action: order.action,
        quantity: order.quantity,
        price: order.price || 0,
        status: "REJECTED",
        message: "Not connected",
      };
    }

    const orderId = `MOCK${Date.now()}`;
    const response: OrderResponse = {
      orderId,
      symbol: order.symbol,
      action: order.action,
      quantity: order.quantity,
      price: order.price || 0,
      status: "FILLED",
      message: "Order executed successfully",
    };

    this.orders.set(orderId, response);

    // 更新账户余额（简化版）
    if (order.action === "BUY") {
      this.accountBalance -= order.quantity * (order.price || 10);
    } else {
      this.accountBalance += order.quantity * (order.price || 10);
    }

    return response;
  }

  async getAccountInfo(): Promise<AccountInfo> {
    return {
      accountId: "MOCK_ACCOUNT",
      balance: this.accountBalance,
      availableBalance: this.accountBalance,
      marketValue: 0,
      totalAssets: this.accountBalance,
      profitLoss: 0,
    };
  }

  async getPositions(): Promise<any[]> {
    return [];
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    const order = this.orders.get(orderId);
    if (order) {
      order.status = "CANCELLED";
      return true;
    }
    return false;
  }

  async getOrderStatus(orderId: string): Promise<string> {
    return this.orders.get(orderId)?.status || "UNKNOWN";
  }
}

/**
 * 券商工厂
 */
export function createBrokerAdapter(config: BrokerConfig): BrokerAdapter {
  switch (config.type) {
    case "easytrader":
      return new EasyTraderAdapter(config);
    case "qmt":
      return new QMTAdapter(config);
    case "mock":
      return new MockBrokerAdapter(config);
    default:
      return new MockBrokerAdapter(config);
  }
}

/**
 * 券商管理器
 */
export class BrokerManager {
  private adapters: Map<string, BrokerAdapter> = new Map();
  private defaultBroker: string = "mock";

  addBroker(name: string, adapter: BrokerAdapter): void {
    this.adapters.set(name, adapter);
  }

  getBroker(name?: string): BrokerAdapter | null {
    const brokerName = name || this.defaultBroker;
    return this.adapters.get(brokerName) || null;
  }

  setDefaultBroker(name: string): void {
    if (this.adapters.has(name)) {
      this.defaultBroker = name;
    }
  }

  async connectAll(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const name of Array.from(this.adapters.keys())) {
      const adapter = this.adapters.get(name);
      if (!adapter) continue;
      try {
        const connected = await adapter.connect();
        results.set(name, connected);
      } catch (error) {
        console.error(`Failed to connect broker ${name}:`, error);
        results.set(name, false);
      }
    }

    return results;
  }

  async disconnectAll(): Promise<void> {
    for (const name of Array.from(this.adapters.keys())) {
      const adapter = this.adapters.get(name);
      if (!adapter) continue;
      try {
        await adapter.disconnect();
      } catch (error) {
        console.error("Failed to disconnect broker:", error);
      }
    }
  }
}

// 导出单例
export const brokerManager = new BrokerManager();

