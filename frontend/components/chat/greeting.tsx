"use client";

import { CircleIcon, StarIcon } from "@radix-ui/react-icons";
import { InlineWidget } from "react-calendly";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "../ui/skeleton";
import { format } from "date-fns";

export function Greeting(): JSX.Element {
  return <div>Thanks for visiting! </div>;
}
