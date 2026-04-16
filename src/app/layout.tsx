import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { CapacitorProvider } from "@/components/capacitor-provider";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Check-In | Athlete Anchor",
  description:
    "Privacy-first athlete wellness platform. Support athletes earlier, protect trust, strengthen teams.",
  icons: {
    icon: "/favicon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0F4A2E",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn("antialiased", dmSans.variable, dmSans.className)}>
        <CapacitorProvider>
          {children}
        </CapacitorProvider>
      </body>
    </html>
  );
}
