import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/layout/site-header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trade Study Agent",
  description: "AI-assisted trade study workspace"
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <SiteHeader />
            <main className="flex-1 bg-muted/30">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
