import type { MetadataRoute } from "next";

const siteUrl = "https://dineleak.app";
const routes = [
  { url: "/", changeFrequency: "weekly" as const, priority: 1 },
  { url: "/support", changeFrequency: "yearly" as const, priority: 0.2 },
  { url: "/privacy", changeFrequency: "yearly" as const, priority: 0.2 },
  { url: "/terms", changeFrequency: "yearly" as const, priority: 0.2 },
  { url: "/refund-policy", changeFrequency: "yearly" as const, priority: 0.2 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${siteUrl}${route.url}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
