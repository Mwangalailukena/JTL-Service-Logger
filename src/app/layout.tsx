import { fontSans, fontMono } from "@/lib/fonts";
import { MonitoringInit } from "@/components/monitoring-init";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/auth-provider";
import { SyncProvider } from "@/providers/sync-provider";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Jeotronix Service Portal",
  description: "Internal ICT and Solar service logging app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Jeotronix",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fontSans.variable} ${fontMono.variable} antialiased bg-background text-foreground font-sans`}>
        <AuthProvider>
          <SyncProvider>
            <ToastProvider>
              <MonitoringInit />
              {children}
            </ToastProvider>
          </SyncProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
