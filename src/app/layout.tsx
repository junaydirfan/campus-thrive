import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CampusThrive - Student Wellness Tracking",
  description: "A privacy-focused student wellness tracking app that stores all data locally. Track your mood, productivity, and wellness metrics with complete data privacy.",
  keywords: ["student", "wellness", "mood tracking", "productivity", "privacy", "local storage"],
  authors: [{ name: "CampusThrive Team" }],
  creator: "CampusThrive",
  publisher: "CampusThrive",
  robots: "noindex, nofollow", // Privacy-focused app
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" }
    ],
    apple: [
      { url: "/logo-192.svg", sizes: "180x180", type: "image/svg+xml" }
    ],
    other: [
      { url: "/logo-192.svg", sizes: "192x192", type: "image/svg+xml" }
    ]
  },
  manifest: "/manifest.json"
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
