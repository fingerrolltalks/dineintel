import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DineIntel | Restaurant Growth Audit",
  description: "Find what is hurting your restaurant online in 60 seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
