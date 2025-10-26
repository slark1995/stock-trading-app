import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";

export default function Trades() {
  const { isAuthenticated } = useAuth();

  // 获取交易记录
  const { data: trades, isLoading } = trpc.trading.getTrades.useQuery(
    { limit: 1000 },
    { enabled: isAuthenticated }
  );

  // 计算统计数据
  const buyTrades = trades?.filter((t) => t.action === "BUY") || [];
  const sellTrades = trades?.filter((t) => t.action === "SELL") || [];

  const totalBuyAmount = buyTrades.reduce((sum, trade) => {
    return sum + (trade.price / 10000) * trade.quantity;
  }, 0);

  const totalSellAmount = sellTrades.reduce((sum, trade) => {
    return sum + (trade.price / 10000) * trade.quantity;
  }, 0);

  const totalProfit = totalSellAmount - totalBuyAmount;

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
            <Link href="/positions">
              <Button variant="ghost">持仓</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">交易记录</h2>
          <p className="text-gray-600 mt-1">查看所有交易历史</p>
        </div>

        {/* 交易统计 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">总交易数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{trades?.length || 0}</div>
              <p className="text-xs text-gray-500 mt-1">笔交易</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">买入笔数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{buyTrades.length}</div>
              <p className="text-xs text-gray-500 mt-1">总金额: ¥{totalBuyAmount.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">卖出笔数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{sellTrades.length}</div>
              <p className="text-xs text-gray-500 mt-1">总金额: ¥{totalSellAmount.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">交易盈亏</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                {totalProfit >= 0 ? "+" : ""}¥{totalProfit.toFixed(2)}
              </div>
              <p className="text-xs text-gray-500 mt-1">已实现盈亏</p>
            </CardContent>
          </Card>
        </div>

        {/* 交易列表 */}
        {isLoading ? (
          <div className="flex justify-center items-center min-h-96">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : trades && trades.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>交易详情</CardTitle>
              <CardDescription>共 {trades.length} 条记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">时间</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">股票代码</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">操作</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">数量</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">价格</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">成交金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => {
                      const price = trade.price / 10000;
                      const amount = price * trade.quantity;

                      return (
                        <tr key={trade.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-600">
                            {new Date(trade.executedAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {trade.symbol}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 text-xs rounded-full font-medium ${
                                trade.action === "BUY"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {trade.action === "BUY" ? "买入" : "卖出"}
                            </span>
                          </td>
                          <td className="text-right py-3 px-4 text-gray-600">
                            {trade.quantity}
                          </td>
                          <td className="text-right py-3 px-4 text-gray-600">
                            ¥{price.toFixed(2)}
                          </td>
                          <td className="text-right py-3 px-4 font-medium text-gray-900">
                            ¥{amount.toFixed(2)}
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
              <p className="text-gray-500 mb-4">暂无交易记录</p>
              <p className="text-sm text-gray-400">
                执行交易后，交易记录将显示在这里
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

