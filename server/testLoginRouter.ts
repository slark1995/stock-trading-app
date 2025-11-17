import { publicProcedure, router } from "./_core/trpc";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import * as db from "./db";

/**
 * 测试登录路由 - 用于开发和测试
 * 创建一个测试用户并设置session cookie
 */
export const testLoginRouter = router({
  // 测试登录 - 创建测试用户并返回登录状态
  testLogin: publicProcedure.mutation(async ({ ctx }) => {
    try {
      // 创建或获取测试用户
      const testOpenId = "test-user-001";
      const testUserInfo = {
        openId: testOpenId,
        name: "测试用户",
        email: "test@example.com",
        loginMethod: "test",
        lastSignedIn: new Date(),
      };

      // 保存用户到数据库
      await db.upsertUser(testUserInfo);

      // 创建session token
      const sessionToken = await sdk.createSessionToken(testOpenId, {
        name: "测试用户",
        expiresInMs: ONE_YEAR_MS,
      });

      // 设置cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      return {
        success: true,
        message: "测试登录成功",
        user: {
          openId: testOpenId,
          name: "测试用户",
          email: "test@example.com",
        },
      };
    } catch (error) {
      console.error("[Test Login] Failed:", error);
      throw new Error("测试登录失败");
    }
  }),
});

