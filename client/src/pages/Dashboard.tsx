import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, Wallet, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [initialBalance, setInitialBalance] = useState(100000000); // 默认100万

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
            <Button className="w-full" size="lg">
              登录
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLoading = accountLoading || strategiesLoading || positionsLoading || tradesLoading;

  // 计算账户总资产
  const currentBalance = account ? account.currentBalance / 10000 : 0;
  const totalAssets = account ? account.totalAssets / 10000 : 0;
  const initialBalanceDisplay = account ? account.initialBalance / 10000 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">A股交易系统</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">欢迎, {user?.name || "用户"}</span>
            <Button variant="outline" size="sm">
              登出
            </Button>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-96">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* 账户概览 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">账户余额</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    ¥{currentBalance.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">可用资金</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">总资产</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    ¥{totalAssets.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    初始: ¥{initialBalanceDisplay.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">收益率</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${totalAssets >= initialBalanceDisplay ? "text-green-600" : "text-red-600"}`}>
                    {((((totalAssets - initialBalanceDisplay) / initialBalanceDisplay) * 100) || 0).toFixed(2)}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">相对初始资金</p>
                </CardContent>
              </Card>
            </div>

            {/* 快速操作 */}
            <Card>
              <CardHeader>
                <CardTitle>快速操作</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4 flex-wrap">
                <Link href="/strategies">
                  <Button className="gap-2">
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
            <Card>
              <CardHeader>
                <CardTitle>我的策略</CardTitle>
                <CardDescription>
                  共 {strategies?.length || 0} 个策略
                </CardDescription>
              </CardHeader>
              <CardContent>
                {strategies && strategies.length > 0 ? (
                  <div className="space-y-3">
                    {strategies.slice(0, 5).map((strategy) => (
                      <div
                        key={strategy.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{strategy.name}</p>
                          <p className="text-sm text-gray-500">
                            {strategy.strategyType === "technical" ? "技术指标策略" : "自定义策略"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              strategy.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {strategy.isActive ? "活跃" : "停用"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-6">
                    暂无策略，
                    <Link href="/strategies" className="text-blue-600 hover:underline">
                      创建一个
                    </Link>
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 最近交易 */}
            <Card>
              <CardHeader>
                <CardTitle>最近交易</CardTitle>
              </CardHeader>
              <CardContent>
                {trades && trades.length > 0 ? (
                  <div className="space-y-3">
                    {trades.map((trade) => (
                      <div
                        key={trade.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{trade.symbol}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(trade.executedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-medium ${
                              trade.action === "BUY" ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {trade.action === "BUY" ? "买入" : "卖出"} {trade.quantity}
                          </p>
                          <p className="text-sm text-gray-500">
                            ¥{(trade.price / 10000).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-6">暂无交易记录</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

