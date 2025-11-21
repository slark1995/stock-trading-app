#!/usr/bin/env python3
"""A股自动交易系统 - 券商集成模块"""

import json
import sys
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    import easytrader
    import tushare as ts
    import akshare as ak
except ImportError as e:
    logger.error(f"缺少必要的库: {e}")
    sys.exit(1)


class BrokerConnector:
    """券商连接器 - 支持同花顺"""
    
    def __init__(self, broker_type: str = "ths"):
        self.broker_type = broker_type
        self.user = None
        self.connected = False
    
    def login(self, username: str, password: str, broker: str = "openquant") -> bool:
        """登录同花顺账户"""
        try:
            self.user = easytrader.use(self.broker_type)
            self.user.login(username, password, broker=broker)
            self.connected = True
            logger.info(f"成功登录同花顺账户: {username}")
            return True
        except Exception as e:
            logger.error(f"登录失败: {e}")
            self.connected = False
            return False
    
    def get_balance(self):
        """获取账户余额信息"""
        if not self.connected or not self.user:
            return None
        
        try:
            balance = self.user.balance
            return {
                "total_assets": balance.get("总资产", 0),
                "available": balance.get("可用资金", 0),
                "market_value": balance.get("股票市值", 0),
                "frozen": balance.get("冻结资金", 0),
            }
        except Exception as e:
            logger.error(f"获取余额失败: {e}")
            return None
    
    def get_positions(self):
        """获取持仓信息"""
        if not self.connected or not self.user:
            return None
        
        try:
            positions = self.user.position
            result = []
            for pos in positions:
                result.append({
                    "symbol": pos.get("证券代码", ""),
                    "name": pos.get("证券名称", ""),
                    "quantity": int(pos.get("数量", 0)),
                    "cost_price": float(pos.get("成本价", 0)),
                    "current_price": float(pos.get("现价", 0)),
                    "market_value": float(pos.get("市值", 0)),
                    "profit_loss": float(pos.get("盈亏", 0)),
                    "profit_rate": float(pos.get("盈亏比例", 0)),
                })
            return result
        except Exception as e:
            logger.error(f"获取持仓失败: {e}")
            return None


class MarketDataProvider:
    """行情数据提供者"""
    
    def __init__(self, data_source: str = "tushare"):
        self.data_source = data_source
        if data_source == "tushare":
            token = os.environ.get("TUSHARE_TOKEN", "")
            if token:
                ts.set_token(token)
                self.pro = ts.pro_connect()
    
    def get_stock_price(self, symbol: str):
        """获取股票实时价格"""
        try:
            if self.data_source == "tushare" and hasattr(self, 'pro'):
                df = self.pro.daily(ts_code=symbol, start_date="", end_date="", limit=1)
                if not df.empty:
                    row = df.iloc[0]
                    return {
                        "symbol": symbol,
                        "price": float(row["close"]),
                        "high": float(row["high"]),
                        "low": float(row["low"]),
                        "volume": int(row["vol"]),
                        "change": float(row["change"]),
                        "change_pct": float(row["pct_chg"]),
                    }
        except Exception as e:
            logger.error(f"获取行情失败 ({symbol}): {e}")
        
        return None


def main():
    """命令行接口"""
    if len(sys.argv) < 2:
        print("用法: python broker-integration.py <command> [args...]")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "login":
        username = sys.argv[2] if len(sys.argv) > 2 else ""
        password = sys.argv[3] if len(sys.argv) > 3 else ""
        broker = sys.argv[4] if len(sys.argv) > 4 else "openquant"
        
        connector = BrokerConnector()
        success = connector.login(username, password, broker)
        print(json.dumps({"success": success}))
    
    elif command == "balance":
        connector = BrokerConnector()
        balance = connector.get_balance()
        print(json.dumps(balance or {}))
    
    elif command == "positions":
        connector = BrokerConnector()
        positions = connector.get_positions()
        print(json.dumps(positions or []))
    
    elif command == "price":
        symbol = sys.argv[2] if len(sys.argv) > 2 else ""
        provider = MarketDataProvider()
        price = provider.get_stock_price(symbol)
        print(json.dumps(price or {}))


if __name__ == "__main__":
    main()

