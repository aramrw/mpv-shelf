import type { Metadata } from "next";
import { IBM_Plex_Sans_JP } from "next/font/google";
import "./globals.css";
import { Navbar } from "./_main-components/main-components";
import { Toaster } from "@/components/ui/toaster";

const mplus = IBM_Plex_Sans_JP({
  subsets: ["latin"],
  //weight: ["100", "300", "400", "500", "700", "800", "900"],
  weight: ["100", "200", "300", "400", "500", "600", "700"]
})

export const metadata: Metadata = {
  title: "MPV-SHELF",
  description: "Cross platform folder wrapper to keep track of videos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${mplus.className} antialiased overflow-auto`} style={{ scrollbarGutter: "stable" }}  >
        <Navbar />
        {children}
        <Toaster />
      </body>
    </html>
  );
}

