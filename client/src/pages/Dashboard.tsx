import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, Wallet, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [initialBalance] = useState(100000000); // 默认100万

  // 获取账户信息
  const { data: account, isLoading: accountLoading } = trpc.trading.getAccount.useQuery(
    { initialBalance },
    { enabled: isAuthenticated }
  );

  // 获取策略列表
  const { data: strategies, isLoading: strategiesLoading } = trpc.trading.getStrategies.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // 获取持仓
  const { data: positions, isLoading: positionsLoading } = trpc.trading.getPositions.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // 获取交易记录
  const { data: trades, isLoading: tradesLoading } = trpc.trading.getTrades.useQuery(
    { limit: 5 },
    { enabled: isAuthenticated }
  );

  // 处理登录
  const handleLogin = () => {
    try {
      const url = getLoginUrl();
      window.location.href = url;
    } catch (error) {
      console.error("登录错误:", error);
      alert("登录配置错误，请刷新页面重试");
    }
  };

  // 测试登录
  const handleTestLogin = async () => {
    try {
      const response = await fetch("/api/trpc/testAuth.testLogin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({}),
      });
      
      if (response.ok) {
        // 登录成功，刷新页面
        window.location.reload();
      } else {
        alert("测试登录失败");
      }
    } catch (error) {
      console.error("测试登录错误:", error);
      alert("测试登录失败");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">A股自动交易系统</CardTitle>
            <CardDescription>智能策略驱动的股票交易平台</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              欢迎使用A股自动交易系统。请登录以开始使用。
            </p>
            <button
              onClick={handleTestLogin}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors"
              type="button"
            >
              测试登录
            </button>
            <p className="text-xs text-gray-500 text-center mt-3">
              或 <button onClick={handleLogin} className="text-blue-600 hover:underline">OAuth登录</button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLoading = accountLoading || strategiesLoading || positionsLoading || tradesLoading;

  // 计算账户总资产
  const totalAssets = account?.totalAssets || 0;
  const currentBalance = account?.currentBalance || 0;
  const profitLoss = (totalAssets - initialBalance) || 0;
  const profitRate = initialBalance > 0 ? ((profitLoss / initialBalance) * 100).toFixed(2) : "0.00";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 顶部信息卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* 账户余额 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">账户余额</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥{currentBalance.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">可用资金</p>
            </CardContent>
          </Card>

          {/* 总资产 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">总资产</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥{totalAssets.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">初始: ¥{initialBalance.toFixed(2)}</p>
            </CardContent>
          </Card>

          {/* 收益率 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">收益率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${profitLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                {profitRate}%
              </div>
              <p className="text-xs text-gray-500 mt-1">相对初始资金</p>
            </CardContent>
          </Card>
        </div>

        {/* 快速操作 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/strategies">
              <Button variant="default" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                管理策略
              </Button>
            </Link>
            <Link href="/positions">
              <Button variant="outline" className="gap-2">
                <Wallet className="w-4 h-4" />
                查看持仓
              </Button>
            </Link>
            <Link href="/trades">
              <Button variant="outline" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                交易记录
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 策略概览 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>我的策略</CardTitle>
            <CardDescription>共 {strategies?.length || 0} 个策略</CardDescription>
          </CardHeader>
          <CardContent>
            {strategiesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : strategies && strategies.length > 0 ? (
              <div className="space-y-2">
                {strategies.slice(0, 3).map((strategy: any) => (
                  <div key={strategy.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{strategy.name}</p>
                      <p className="text-sm text-gray-500">{strategy.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      strategy.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {strategy.enabled ? "启用" : "禁用"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">暂无策略</p>
                <Link href="/strategies">
                  <Button variant="link" className="mt-2">创建一个</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 最近交易 */}
        <Card>
          <CardHeader>
            <CardTitle>最近交易</CardTitle>
          </CardHeader>
          <CardContent>
            {tradesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : trades && trades.length > 0 ? (
              <div className="space-y-2">
                {trades.map((trade: any) => (
                  <div key={trade.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{trade.symbol}</p>
                      <p className="text-sm text-gray-500">{new Date(trade.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${trade.action === "BUY" ? "text-red-600" : "text-green-600"}`}>
                        {trade.action === "BUY" ? "买入" : "卖出"} {trade.quantity}
                      </p>
                      <p className="text-sm text-gray-500">¥{trade.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">暂无交易记录</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

