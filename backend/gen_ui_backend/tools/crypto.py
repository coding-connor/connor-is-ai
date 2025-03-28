import os
from typing import Dict, Union

import requests
from langchain_core.tools import tool
from pydantic import BaseModel, Field

# Uniswap V2 subgraph endpoint
SUBGRAPH_URL = "https://gateway-arbitrum.network.thegraph.com/api/subgraphs/id/EYCKATKGBKLWvSfwvBjzfCBmGwYNdVkduYXVivCsLRFu"

# Token addresses for BTC and ETH
TOKEN_ADDRESSES = {
    "BTC": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",  # WBTC on Arbitrum
    "ETH": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",  # WETH on Arbitrum
    "USDC": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",  # USDC on Arbitrum
}

# Common variations of cryptocurrency names
CRYPTO_VARIATIONS = {
    "bitcoin": "BTC",
    "btc": "BTC",
    "wbtc": "BTC",
    "wrapped btc": "BTC",
    "wrapped bitcoin": "BTC",
    "ethereum": "ETH",
    "eth": "ETH",
    "weth": "ETH",
    "wrapped eth": "ETH",
    "wrapped ethereum": "ETH",
    "usdc": "USDC",
    "usd": "USDC",
    "usd coin": "USDC",
    "usd coin (usdc)": "USDC",
}


class CryptoInput(BaseModel):
    crypto: str = Field(
        ...,
        description="""The cryptocurrency to get price for. Use this tool when users ask about:
        - Current price/stats of Bitcoin/BTC/WBTC
        - Current price/stats of Ethereum/ETH/WETH
        - How much is Bitcoin/BTC worth?
        - What's the price of ETH?
        - What's the value of BTC?
        - Tell me about WBTC/WETH
        Acceptable values: 'bitcoin', 'btc', 'wbtc', 'ethereum', 'eth', 'weth', 'usdc', 'usd', 'usd coin', 'usd coin (usdc)'""",
    )


@tool(
    "crypto-price",
    args_schema=CryptoInput,
    return_direct=True,
    description="""Use this tool to get real-time cryptocurrency prices and market data from Uniswap.
    This tool should be used when users ask about:
    - Current price/stats of Bitcoin/BTC/WBTC
    - Current price/stats of Ethereum/ETH/WETH
    - How much is Bitcoin worth?
    - What's the price of ETH?
    - What's the value of BTC?
    - Tell me about WBTC/WETH
    
    The tool will return:
    - Token name and symbol
    - Current price in ETH
    - 24-hour trading volume
    - Total liquidity in the pool
    
    Always use this tool for cryptocurrency price queries rather than trying to calculate or estimate prices yourself.""",
)
def crypto_price(crypto: str) -> Union[Dict, str]:
    """Get the price and stats of BTC (WBTC) or ETH (WETH) or USDC from Uniswap."""
    if not os.environ.get("THEGRAPH_API_KEY"):
        raise ValueError("Missing THEGRAPH_API_KEY secret.")

    # Convert input to lowercase and check for variations
    crypto_lower = crypto.lower()
    if crypto_lower not in CRYPTO_VARIATIONS:
        return {
            "error": "Unsupported cryptocurrency. Please use bitcoin/btc/wbtc or ethereum/eth/weth or usdc/usd/usd coin."
        }

    crypto_symbol = CRYPTO_VARIATIONS[crypto_lower]
    token_address = TOKEN_ADDRESSES[crypto_symbol]

    headers = {
        "Content-Type": "application/json",
        "Authorization": f'Bearer {os.environ["THEGRAPH_API_KEY"]}',
    }

    query = """
    query GetToken($id: String!) {
        token(id: $id) {
            name
            symbol
            decimals
            derivedETH
            tradeVolumeUSD
            totalLiquidity
        }
    }
    """

    variables = {"id": token_address.lower()}

    try:
        response = requests.post(
            SUBGRAPH_URL, headers=headers, json={"query": query, "variables": variables}
        )
        response.raise_for_status()
        data = response.json()

        if "errors" in data:
            return {"error": f"GraphQL error: {data['errors'][0]['message']}"}

        token_data = data.get("data", {}).get("token")
        if not token_data:
            return {"error": f"No data found for {crypto_symbol}"}

        return {
            "crypto": crypto_symbol,
            "name": token_data["name"],
            "symbol": token_data["symbol"],
            "decimals": token_data["decimals"],
            "price_in_eth": float(token_data["derivedETH"]),
            "trade_volume_usd": float(token_data["tradeVolumeUSD"]),
            "total_liquidity": float(token_data["totalLiquidity"]),
        }

    except requests.exceptions.RequestException as err:
        print(f"Error fetching crypto price: {err}")
        return {"error": "Failed to fetch cryptocurrency data."}
