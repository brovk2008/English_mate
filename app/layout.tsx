import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, DM_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/lib/i18n/context";
import SakuraCanvas from "@/components/SakuraCanvas";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "700"],
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
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
      className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable} h-full antialiased`}
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
