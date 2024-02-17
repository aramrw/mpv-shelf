import type { Metadata } from "next";
import { M_PLUS_1p } from "next/font/google";
import "./globals.css";
import { Navbar } from "./_main-components/main-components";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/toaster";

const mplus = M_PLUS_1p({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "800", "900"],
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
        <ThemeProvider
          enableSystem={true}
        >
          <Navbar />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
