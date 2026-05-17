import type { Metadata } from "next";
import "./globals.css";

const siteUrl = new URL("https://dineleak.app");
const tagline = "Find where your restaurant is leaking customers, orders, and revenue online.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "DineLeak | Restaurant Growth Audit",
    template: "%s | DineLeak",
  },
  description: tagline,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "DineLeak | Restaurant Growth Audit",
    description: tagline,
    url: siteUrl,
    siteName: "DineLeak",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DineLeak | Restaurant Growth Audit",
    description: tagline,
  },
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
