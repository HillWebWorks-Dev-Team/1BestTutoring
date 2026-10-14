import type { Metadata } from "next";
import { Suspense } from "react";
import { Caveat, Inter, Playfair_Display } from "next/font/google";
import { NavigationProgress } from "@/components/site/NavigationProgress";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat" });

export const metadata: Metadata = {
  title: { default: `${BRAND.name}`, template: `%s · ${BRAND.name}` },
  description: BRAND.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${caveat.variable}`}>
      <body className="min-h-screen bg-ivory font-sans text-ink antialiased">
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
