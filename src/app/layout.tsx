import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Toaster } from "@/components/ui/toaster";
import { DataProvider } from "@/components/DataProvider";
import { cn } from "@/lib/utils";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ApexOS Mission Control",
  description: "Real-time multi-agent dashboard for ApexOS - Using REAL OpenClaw data only",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Force dark mode */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              document.documentElement.classList.add('dark');
              document.documentElement.style.colorScheme = 'dark';
            })();
          `
        }} />
      </head>
      <body className={cn(
        inter.className, 
        "min-h-screen bg-background text-foreground antialiased"
      )}>
        <DataProvider>
          <div className="flex h-screen bg-slate-950">
            <Sidebar />
            <main className="flex-1 overflow-auto ml-64 transition-all duration-300">
              <div className="p-6 min-h-screen">
                {children}
              </div>
            </main>
          </div>
          <Toaster />
        </DataProvider>
      </body>
    </html>
  );
}
