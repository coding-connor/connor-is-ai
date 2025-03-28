"use client";

import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export interface CryptoPriceProps {
  crypto: string;
  name: string;
  symbol: string;
  decimals: string;
  price_in_eth: number;
  trade_volume_usd: number;
  total_liquidity: number;
}

export interface CryptoError {
  error: string;
}

export function CryptoPriceLoading(): JSX.Element {
  return (
    <Card className="w-[450px] p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-[24px] w-[120px]" />
          <Skeleton className="h-[24px] w-[80px]" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-[32px] w-[200px]" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-[16px] w-[100px]" />
            <Skeleton className="h-[24px] w-[80px]" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-[16px] w-[100px]" />
            <Skeleton className="h-[24px] w-[80px]" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function CryptoPriceError(props: CryptoError): JSX.Element {
  return (
    <Card className="w-[450px] p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-red-500">Error</h3>
        </div>
        <div className="text-sm text-muted-foreground">{props.error}</div>
      </div>
    </Card>
  );
}

export function CryptoPrice(props: CryptoPriceProps): JSX.Element {
  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(4)}`;
  };

  return (
    <Card className="w-[450px] p-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{props.name}</h3>
          <span className="text-sm text-muted-foreground">{props.symbol}</span>
        </div>
        <div className="space-y-2">
          <div className="text-3xl font-bold">
            {props.price_in_eth.toFixed(4)} ETH
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">24h Volume</div>
            <div className="font-medium">
              {formatNumber(props.trade_volume_usd)}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Total Liquidity</div>
            <div className="font-medium">
              {formatNumber(props.total_liquidity)}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
