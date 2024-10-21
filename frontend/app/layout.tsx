import "./globals.css";
import type { Metadata } from "next";

import { EndpointsContext } from "./agent";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "LangChain Gen UI",
  description: "Generative UI application with LangChain Python",
};

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex flex-col p-0 md:p-12 h-[100vh] dark:bg-slate-800">
          <EndpointsContext>{props.children}</EndpointsContext>
        </div>
      </body>
    </html>
  );
}
