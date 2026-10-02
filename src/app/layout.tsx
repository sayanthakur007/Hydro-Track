import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "HydroTrack — Smart Water Tracker & Reminders",
  description:
    "HydroTrack helps you build a lasting hydration habit with a beautiful dashboard, smart reminders, streaks, and statistics.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#030a1c" },
    { media: "(prefers-color-scheme: light)", color: "#dcecff" },
  ],
  width: "device-width",
  initialScale: 1,
};

const themeInit = `(function(){try{var t=localStorage.getItem("hydro-theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="dark";}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className={`${outfit.variable} ${inter.variable} antialiased`}>
        <div className="flex min-h-dvh flex-col">
          {children}
          <footer className="relative z-10 mt-auto px-4 pb-24 pt-5 text-center text-sm text-(--ink-3) lg:pb-5">
            © {new Date().getFullYear()} HydroTrack · Created by Sayan
          </footer>
        </div>
      </body>
    </html>
  );
}
