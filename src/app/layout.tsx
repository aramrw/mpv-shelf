import type { Metadata } from "next";
import { IBM_Plex_Sans_JP } from "next/font/google";
import "./globals.css";
import { Navbar } from "./_main-components/main-components";
import { Toaster } from "@/components/ui/toaster";
import { appWindow } from "@tauri-apps/api/window";
import { TauriEvent } from "@tauri-apps/api/event"
import { setCurrentUserGlobal } from "../../lib/prisma-commands";

const mplus = IBM_Plex_Sans_JP({
  subsets: ["latin"],
  //weight: ["100", "300", "400", "500", "700", "800", "900"],
  weight: ["100", "200", "300", "400", "500", "600", "700"]
})

export const metadata: Metadata = {
  title: "MPV-SHELF",
  description: "Cross platform folder wrapper to keep track of videos. Works with any video player.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${mplus.className} antialiased `}>
        <Navbar />
        {children}
        <Toaster />
      </body>
    </html>
  );
}

