import type { Metadata } from "next";
import "./globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";
import { EndpointsContext } from "./agent";

export const metadata: Metadata = {
  title: "Connor's AI Representative",
  description: "Connor Haines's Professional AI Representative",
};

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <div className="flex flex-col p-0 md:pt-6 h-[100vh]">
            <EndpointsContext>{props.children}</EndpointsContext>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
