import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Navbar } from "./_main-components/main-components";
import { Toaster } from "@/components/ui/toaster";
//import { ThemeProvider } from "@/components/ui/theme-provider";

// const mplus = Poppins({
//   subsets: ["latin", "latin-ext", "devanagari"],
//   //weight: ["100", "300", "400", "500", "700", "800", "900"],
//   weight: ["100", "200", "300", "400", "500", "600", "700"],
//   display: "swap",
// })

const noto = Noto_Sans_JP({
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  display: "swap",
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
      <body className={`${noto.className} subpixel-antialiased overflow-y-hidden leading-4`}
        style={{ scrollbarGutter: "stable" }}
      >
        <Navbar />
        {children}
        <Toaster />
      </body>
    </html>
  );
}

