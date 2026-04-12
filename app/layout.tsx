import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./main.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Navix AI",
  description: "Market and competitor intelligence copilot for social media",
  icons: {
    icon: "/favicon.svg",
    apple: "/logo_navix_ico.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased bg-background text-foreground selection:bg-primary selection:text-white`}
      >
        {children}
      </body>
    </html>
  );
}
