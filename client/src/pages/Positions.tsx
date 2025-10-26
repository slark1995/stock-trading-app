import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";

export default function Positions() {
  const { isAuthenticated } = useAuth();

  // 获取持仓
  const { data: positions, isLoading: positionsLoading } = trpc.trading.getPositions.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // 获取账户信息
  const { data: account } = trpc.trading.getAccount.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const isLoading = positionsLoading;

  // 计算总持仓价值
  const totalPositionValue = positions?.reduce((sum, pos) => {
    const currentPrice = pos.currentPrice / 10000;
    return sum + currentPrice * pos.quantity;
  }, 0) || 0;

  // 计算总成本
  const totalCost = positions?.reduce((sum, pos) => {
    const costPrice = pos.costPrice / 10000;
    return sum + costPrice * pos.quantity;
  }, 0) || 0;

  const totalProfit = totalPositionValue - totalCost;
  const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <Link href="/">
              <h1 className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600">
                A股交易系统
              </h1>
            </Link>
          </div>
          <div className="flex gap-2">
            <Link href="/strategies">
              <Button variant="ghost">策略</Button>
            </Link>
            <Link href="/trades">
              <Button variant="ghost">交易记录</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">持仓管理</h2>
          <p className="text-gray-600 mt-1">查看和管理您的股票持仓</p>
        </div>

        {/* 持仓概览 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">总持仓价值</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                ¥{totalPositionValue.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">当前市值</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">总成本</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                ¥{totalCost.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">买入成本</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">持仓盈亏</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                {totalProfit >= 0 ? "+" : ""}¥{totalProfit.toFixed(2)}
              </div>
              <p className={`text-xs mt-1 ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                {totalProfit >= 0 ? "+" : ""}{totalProfitPercent.toFixed(2)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 持仓列表 */}
        {isLoading ? (
          <div className="flex justify-center items-center min-h-96">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : positions && positions.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>持仓详情</CardTitle>
              <CardDescription>共 {positions.length} 只股票</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">股票代码</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">持仓数量</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">成本价</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">现价</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">市值</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">盈亏</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">盈亏率</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((position) => {
                      const costPrice = position.costPrice / 10000;
                      const currentPrice = position.currentPrice / 10000;
                      const marketValue = currentPrice * position.quantity;
                      const costValue = costPrice * position.quantity;
                      const profit = marketValue - costValue;
                      const profitPercent = (profit / costValue) * 100;

                      return (
                        <tr key={position.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {position.symbol}
                          </td>
                          <td className="text-right py-3 px-4 text-gray-600">
                            {position.quantity}
                          </td>
                          <td className="text-right py-3 px-4 text-gray-600">
                            ¥{costPrice.toFixed(2)}
                          </td>
                          <td className="text-right py-3 px-4 text-gray-600">
                            ¥{currentPrice.toFixed(2)}
                          </td>
                          <td className="text-right py-3 px-4 text-gray-600">
                            ¥{marketValue.toFixed(2)}
                          </td>
                          <td className={`text-right py-3 px-4 font-medium ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {profit >= 0 ? "+" : ""}¥{profit.toFixed(2)}
                          </td>
                          <td className={`text-right py-3 px-4 font-medium ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                            <div className="flex items-center justify-end gap-1">
                              {profit >= 0 ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              {profit >= 0 ? "+" : ""}{profitPercent.toFixed(2)}%
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <Button variant="ghost" size="sm">
                              卖出
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">暂无持仓</p>
              <p className="text-sm text-gray-400">
                创建策略并执行交易后，持仓将显示在这里
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

