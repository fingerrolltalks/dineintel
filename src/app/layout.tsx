import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { SiteFooter } from "@/components/SiteFooter";
import { GA_MEASUREMENT_ID, isGoogleAnalyticsEnabled } from "@/lib/analytics";
import "./globals.css";

const siteUrl = new URL("https://dineleak.app");

export const metadata: Metadata = {
  applicationName: "DineLeak",
  metadataBase: siteUrl,
  title: {
    default: "DineLeak | Restaurant Growth Scanner",
    template: "%s | DineLeak",
  },
  description: "Restaurant growth scanner and audit platform for spotting leaks in visibility, conversion, reviews, social, and retention.",
  keywords: ["DineLeak", "restaurant growth audit", "restaurant SEO", "restaurant marketing", "conversion audit"],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "DineLeak | Restaurant Growth Scanner",
    description: "Restaurant growth scanner and audit platform for spotting leaks in visibility, conversion, reviews, social, and retention.",
    url: siteUrl,
    siteName: "DineLeak",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DineLeak restaurant growth audit",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DineLeak | Restaurant Growth Scanner",
    description: "Restaurant growth scanner and audit platform for spotting leaks in visibility, conversion, reviews, social, and retention.",
    images: ["/og-image.png"],
  },
};

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "DineLeak",
  url: "https://dineleak.app",
  logo: "https://dineleak.app/icon.png",
  sameAs: ["https://www.instagram.com/dineleak/"],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "DineLeak",
  url: "https://dineleak.app",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://dineleak.app/?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Script id="org-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
        <Script id="website-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        {children}
        <SiteFooter />
        <Analytics />
        {isGoogleAnalyticsEnabled() ? (
        <>
          <Script
            id="ga4-loader"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];function gtag(){window.dataLayer.push(arguments);}window.gtag = gtag;gtag('js', new Date());gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });`}
          </Script>
          <Suspense fallback={null}>
            <GoogleAnalytics />
          </Suspense>
        </>
        ) : null}
      </body>
    </html>
  );
}
