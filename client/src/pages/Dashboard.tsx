import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Wallet } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

interface AccountInfo {
  balance: number;
  totalAssets: number;
  profitRate: number;
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const [account, setAccount] = useState<AccountInfo>({
    balance: 100000000,
    totalAssets: 100000000,
    profitRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟加载账户数据
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">A股自动交易系统</h1>
          <div className="text-sm text-gray-600">本地版本</div>
        </div>
      </div>

      {/* 主内容 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 账户信息卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">账户余额</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ¥{(account.balance / 100000000).toFixed(2)}亿
              </div>
              <p className="text-xs text-gray-500 mt-1">可用资金</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总资产</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ¥{(account.totalAssets / 100000000).toFixed(2)}亿
              </div>
              <p className="text-xs text-gray-500 mt-1">初始: ¥1.00亿</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">收益率</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${account.profitRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {account.profitRate >= 0 ? '+' : ''}{account.profitRate.toFixed(2)}%
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
          <CardContent className="flex flex-wrap gap-4">
            <Button 
              onClick={() => navigate('/account', { replace: false })}
              className="bg-green-600 hover:bg-green-700"
            >
              🔗 连接账户
            </Button>
            <Button 
              onClick={() => navigate('/strategies', { replace: false })}
              className="bg-blue-600 hover:bg-blue-700"
            >
              📊 管理策略
            </Button>
            <Button 
              onClick={() => navigate('/positions', { replace: false })}
              variant="outline"
            >
              📈 查看持仓
            </Button>
            <Button 
              onClick={() => navigate('/trades', { replace: false })}
              variant="outline"
            >
              📝 交易记录
            </Button>
          </CardContent>
        </Card>

        {/* 主要内容区域 */}
        <Card>
          <CardHeader>
            <CardTitle>功能导航</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">概览</TabsTrigger>
                <TabsTrigger value="features">功能说明</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">欢迎使用A股自动交易系统</h3>
                  <p className="text-sm text-blue-800">
                    这是一个本地化的股票交易模拟系统。您可以创建交易策略、模拟交易、查看持仓和交易记录。
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-600 pl-4">
                    <h4 className="font-semibold text-gray-900">📊 策略管理</h4>
                    <p className="text-sm text-gray-600">创建和管理自动交易策略，支持技术指标和自定义规则</p>
                  </div>
                  <div className="border-l-4 border-green-600 pl-4">
                    <h4 className="font-semibold text-gray-900">📈 持仓管理</h4>
                    <p className="text-sm text-gray-600">实时查看当前持仓、成本价、盈亏等信息</p>
                  </div>
                  <div className="border-l-4 border-purple-600 pl-4">
                    <h4 className="font-semibold text-gray-900">📝 交易记录</h4>
                    <p className="text-sm text-gray-600">查看历史交易记录和交易统计分析</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

