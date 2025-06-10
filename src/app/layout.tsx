import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter'
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-jetbrains-mono'
});

export const metadata: Metadata = {
  title: "Code Index - AI-Powered Code Analysis",
  description: "Index your code projects and chat with AI about your codebase. Get intelligent insights and understand your code better with advanced semantic search.",
  keywords: ["code analysis", "AI", "developer tools", "code search", "programming"],
  authors: [{ name: "Code Index Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
          {children}
        </div>
      </body>
    </html>
  );
}
