import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";

interface StrategyForm {
  name: string;
  description: string;
  strategyType: "technical" | "custom";
  rules: string;
}

const defaultTechnicalRules = {
  indicators: {
    ma5: true,
    ma10: true,
    ma20: true,
    rsi14: true,
    macd: true,
    bollingerBands: true,
  },
  stopLoss: 5,
  takeProfit: 10,
  maxPositionSize: 1000,
};

const defaultCustomRules = {
  buyConditions: ["价格低于MA20时买入"],
  sellConditions: ["价格高于MA5时卖出"],
  stopLoss: 5,
  takeProfit: 10,
};

export default function Strategies() {
  const { isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<StrategyForm>({
    name: "",
    description: "",
    strategyType: "technical",
    rules: JSON.stringify(defaultTechnicalRules, null, 2),
  });

  // 获取策略列表
  const { data: strategies, isLoading } = trpc.trading.getStrategies.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // 创建策略
  const createMutation = trpc.trading.createStrategy.useMutation({
    onSuccess: () => {
      setShowForm(false);
      setFormData({
        name: "",
        description: "",
        strategyType: "technical",
        rules: JSON.stringify(defaultTechnicalRules, null, 2),
      });
      // 重新获取策略列表
      trpc.useUtils().trading.getStrategies.invalidate();
    },
  });

  const handleStrategyTypeChange = (type: "technical" | "custom") => {
    setFormData({
      ...formData,
      strategyType: type,
      rules: JSON.stringify(
        type === "technical" ? defaultTechnicalRules : defaultCustomRules,
        null,
        2
      ),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: formData.name,
      description: formData.description,
      strategyType: formData.strategyType,
      rules: formData.rules,
    });
  };

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
            <Link href="/positions">
              <Button variant="ghost">持仓</Button>
            </Link>
            <Link href="/trades">
              <Button variant="ghost">交易记录</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">策略管理</h2>
            <p className="text-gray-600 mt-1">创建和管理您的交易策略</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" />
            新建策略
          </Button>
        </div>

        {/* 创建策略表单 */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>创建新策略</CardTitle>
              <CardDescription>配置您的交易策略规则</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 策略名称 */}
                <div>
                  <Label htmlFor="name">策略名称</Label>
                  <Input
                    id="name"
                    placeholder="例如：均线交叉策略"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                {/* 策略描述 */}
                <div>
                  <Label htmlFor="description">策略描述</Label>
                  <Textarea
                    id="description"
                    placeholder="描述您的策略逻辑"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                {/* 策略类型 */}
                <div>
                  <Label>策略类型</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="strategyType"
                        value="technical"
                        checked={formData.strategyType === "technical"}
                        onChange={() => handleStrategyTypeChange("technical")}
                      />
                      <span>技术指标策略</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="strategyType"
                        value="custom"
                        checked={formData.strategyType === "custom"}
                        onChange={() => handleStrategyTypeChange("custom")}
                      />
                      <span>自定义策略</span>
                    </label>
                  </div>
                </div>

                {/* 策略规则 */}
                <div>
                  <Label htmlFor="rules">策略规则 (JSON)</Label>
                  <Textarea
                    id="rules"
                    value={formData.rules}
                    onChange={(e) =>
                      setFormData({ ...formData, rules: e.target.value })
                    }
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.strategyType === "technical"
                      ? "配置技术指标和风险管理参数"
                      : "定义自定义的买卖条件"}
                  </p>
                </div>

                {/* 按钮 */}
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    取消
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    创建策略
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 策略列表 */}
        {isLoading ? (
          <div className="flex justify-center items-center min-h-96">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : strategies && strategies.length > 0 ? (
          <div className="grid gap-6">
            {strategies.map((strategy) => (
              <Card key={strategy.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{strategy.name}</CardTitle>
                      <CardDescription>{strategy.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-medium ${
                          strategy.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {strategy.isActive ? "活跃" : "停用"}
                      </span>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">类型:</span>{" "}
                      {strategy.strategyType === "technical"
                        ? "技术指标策略"
                        : "自定义策略"}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">创建时间:</span>{" "}
                      {new Date(strategy.createdAt).toLocaleString()}
                    </p>
                    <details className="text-sm">
                      <summary className="cursor-pointer text-blue-600 hover:underline">
                        查看规则
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                        {strategy.rules}
                      </pre>
                    </details>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">还没有创建任何策略</p>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                创建第一个策略
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

