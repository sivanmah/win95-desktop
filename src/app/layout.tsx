import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import localFont from "next/font/local";

const w95fa = localFont({
  src: [
    {
      path: "../../public/fonts/w95fa.woff2",
      weight: "normal",
      style: "normal",
    },
  ],
});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={w95fa.className}>{children}</body>
    </html>
  );
}