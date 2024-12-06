"use client";

import { InlineWidget } from "react-calendly";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "../ui/skeleton";

export interface CalendlyProps {
  account: string;
}

export interface CalendlyError {
  error: string;
}

export function CalendlyLoading(): JSX.Element {
  return (
    <Card className="w-[450px]">
      <CardHeader className="grid grid-cols-[1fr_110px] items-start gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle>
            <Skeleton className="h-[18px] w-[48px]" />
          </CardTitle>
          <CardDescription>
            <div className="flex flex-col gap-[2px] pt-[4px]">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton
                  key={`description-${i}`}
                  className="h-[12px] w-[86px]"
                />
              ))}
            </div>
          </CardDescription>
        </div>
        <div className="flex items-center space-x-1 rounded-md bg-secondary text-secondary-foreground">
          <Skeleton className="h-[38px]" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[12px]" />
      </CardContent>
    </Card>
  );
}

export function CalendlyError(props: CalendlyError): JSX.Element {
  return (
    <Card className="w-[450px]">
      <CardHeader className="grid grid-cols-[1fr_110px] items-start gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle>ERROR</CardTitle>
          <CardDescription>
            <div className="flex flex-col gap-[2px] pt-[4px]">
              {props.error}
            </div>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[12px]" />
      </CardContent>
    </Card>
  );
}

export function Calendly(props: CalendlyProps): JSX.Element {
  return <InlineWidget url={`https://calendly.com/${props.account}`} />;
}
