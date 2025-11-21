import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AccountLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [broker, setBroker] = useState("openquant");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [connected, setConnected] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/broker/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, broker }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "登录成功！" });
        setConnected(true);
        fetchAccountInfo();
      } else {
        setMessage({ type: "error", text: data.error || "登录失败" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "网络错误，请检查连接" });
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountInfo = async () => {
    try {
      const response = await fetch("/api/broker/balance");
      const data = await response.json();
      setAccountInfo(data);
    } catch (error) {
      console.error("获取账户信息失败:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/broker/logout", { method: "POST" });
      setConnected(false);
      setAccountInfo(null);
      setUsername("");
      setPassword("");
      setMessage({ type: "success", text: "已登出" });
    } catch (error) {
      console.error("登出失败:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">账户连接</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {connected ? (
          <div className="space-y-6">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-green-900">已连接到券商</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">账户用户名</p>
                  <p className="text-lg font-semibold text-gray-900">{username}</p>
                </div>

                {accountInfo && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">总资产</p>
                        <p className="text-lg font-semibold text-gray-900">
                          ¥{(accountInfo.total_assets || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">可用资金</p>
                        <p className="text-lg font-semibold text-green-600">
                          ¥{(accountInfo.available || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">股票市值</p>
                        <p className="text-lg font-semibold text-gray-900">
                          ¥{(accountInfo.market_value || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">冻结资金</p>
                        <p className="text-lg font-semibold text-orange-600">
                          ¥{(accountInfo.frozen || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={handleLogout}
                      variant="destructive"
                      className="w-full"
                    >
                      登出账户
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>连接您的券商账户</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                输入您的同花顺账户信息以连接到券商
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="broker">选择券商</Label>
                  <Select value={broker} onValueChange={setBroker}>
                    <SelectTrigger id="broker">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openquant">开源证券</SelectItem>
                      <SelectItem value="dongwu">东吴证券</SelectItem>
                      <SelectItem value="huatai">华泰证券</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">同花顺用户名</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="输入您的同花顺账户用户名"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">同花顺密码</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="输入您的同花顺账户密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {message && (
                  <Alert
                    className={
                      message.type === "success"
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                    }
                  >
                    {message.type === "error" && (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription
                      className={
                        message.type === "success"
                          ? "text-green-800"
                          : "text-red-800"
                      }
                    >
                      {message.text}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      连接中...
                    </>
                  ) : (
                    "连接账户"
                  )}
                </Button>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    <strong>安全提示：</strong>
                    您的账户信息仅在本地使用，不会被上传到服务器。
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

