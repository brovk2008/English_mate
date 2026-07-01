import type { Metadata } from "next";
import { Fraunces, Noto_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/lib/i18n/context";
import SakuraCanvas from "@/components/SakuraCanvas";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700"],
  display: "swap",
});

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sakura English Journey",
  description: "90 days. One mission a day. Real progress. A personalized English learning experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${notoSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-body bg-bg text-ink selection:bg-sakura/30">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true}>
          <I18nProvider>
            <SakuraCanvas />
            <div className="relative z-10 flex-1 flex flex-col">{children}</div>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
