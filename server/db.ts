import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.


import { desc, and } from "drizzle-orm";
import type { InsertStrategy, InsertTrade, InsertMarketData, InsertPosition, Strategy, Position, Trade, Account } from "../drizzle/schema";
import { strategies, positions, trades, marketData, accounts } from "../drizzle/schema";

/**
 * 获取用户账户
 */
export async function getOrCreateAccount(userId: number, initialBalance: number = 100000000) {
  const db = await getDb();
  if (!db) return undefined;

  const existing = await db.select().from(accounts).where(eq(accounts.userId, userId)).limit(1);
  if (existing.length > 0) {
    return existing[0];
  }

  // Create new account with initial balance (stored as integer: balance * 10000)
  await db.insert(accounts).values({
    userId,
    initialBalance,
    currentBalance: initialBalance,
    totalAssets: initialBalance,
  });

  const newAccount = await db.select().from(accounts).where(eq(accounts.userId, userId)).limit(1);
  return newAccount[0];
}

/**
 * 获取用户的所有策略
 */
export async function getUserStrategies(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(strategies).where(eq(strategies.userId, userId));
}

/**
 * 获取用户的持仓
 */
export async function getUserPositions(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(positions).where(eq(positions.userId, userId));
}

/**
 * 获取用户的交易记录
 */
export async function getUserTrades(userId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(trades).where(eq(trades.userId, userId)).orderBy(desc(trades.executedAt)).limit(limit);
}

/**
 * 创建新策略
 */
export async function createStrategy(userId: number, data: Omit<InsertStrategy, 'userId'>) {
  const db = await getDb();
  if (!db) return undefined;

  await db.insert(strategies).values({
    ...data,
    userId,
  });

  const result = await db.select().from(strategies).where(eq(strategies.userId, userId)).orderBy(desc(strategies.createdAt)).limit(1);
  return result[0];
}

/**
 * 更新策略
 */
export async function updateStrategy(strategyId: number, data: Partial<Omit<InsertStrategy, 'userId'>>) {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(strategies).set(data).where(eq(strategies.id, strategyId));

  const result = await db.select().from(strategies).where(eq(strategies.id, strategyId)).limit(1);
  return result[0];
}

/**
 * 记录一笔交易
 */
export async function recordTrade(userId: number, data: Omit<InsertTrade, 'userId'>) {
  const db = await getDb();
  if (!db) return undefined;

  await db.insert(trades).values({
    ...data,
    userId,
  });

  const result = await db.select().from(trades).where(eq(trades.userId, userId)).orderBy(desc(trades.executedAt)).limit(1);
  return result[0];
}

/**
 * 更新持仓
 */
export async function updatePosition(userId: number, symbol: string, quantity: number, currentPrice: number) {
  const db = await getDb();
  if (!db) return undefined;

  const existing = await db.select().from(positions).where(
    and(eq(positions.userId, userId), eq(positions.symbol, symbol))
  ).limit(1);

  if (existing.length > 0) {
    if (quantity <= 0) {
      // Delete position if quantity becomes 0 or negative
      await db.delete(positions).where(eq(positions.id, existing[0].id));
      return null;
    }
    await db.update(positions).set({ quantity, currentPrice }).where(eq(positions.id, existing[0].id));
    const updated = await db.select().from(positions).where(eq(positions.id, existing[0].id)).limit(1);
    return updated[0];
  } else if (quantity > 0) {
    // Create new position
    await db.insert(positions).values({
      userId,
      symbol,
      quantity,
      costPrice: currentPrice,
      currentPrice,
    });
    const newPos = await db.select().from(positions).where(
      and(eq(positions.userId, userId), eq(positions.symbol, symbol))
    ).limit(1);
    return newPos[0];
  }

  return undefined;
}

/**
 * 获取最新的行情数据
 */
export async function getLatestMarketData(symbol: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(marketData).where(eq(marketData.symbol, symbol)).orderBy(desc(marketData.date)).limit(1);
  return result[0];
}

/**
 * 保存行情数据
 */
export async function saveMarketData(data: InsertMarketData) {
  const db = await getDb();
  if (!db) return undefined;

  // Check if data already exists for this symbol and date
  const existing = await db.select().from(marketData).where(
    and(eq(marketData.symbol, data.symbol), eq(marketData.date, data.date))
  ).limit(1);

  if (existing.length > 0) {
    // Update existing record
    await db.update(marketData).set(data).where(eq(marketData.id, existing[0].id));
    return existing[0];
  } else {
    // Insert new record
    await db.insert(marketData).values(data);
    const result = await db.select().from(marketData).where(
      and(eq(marketData.symbol, data.symbol), eq(marketData.date, data.date))
    ).limit(1);
    return result[0];
  }
}

