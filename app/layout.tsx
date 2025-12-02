import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Rajdhani } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/layout/site-header";

const inter = Inter({ subsets: ["latin"] });
const rajdhani = Rajdhani({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

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
    <html lang="en" className={rajdhani.className}>
      <body className="hud-scanlines font-hud">
        <Providers>
          <div className="min-h-screen flex flex-col">
            <SiteHeader />
            <main className="flex-1 bg-transparent px-4 py-6">
              <div className="mx-auto w-full max-w-screen-xl space-y-8">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
