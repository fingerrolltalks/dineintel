export type AuditInput = {
  restaurant: string;
  website: string;
  instagram: string;
  tiktok?: string;
};

export type AuditCategory = {
  name: string;
  score: number;
  issue: string;
  why: string;
  fix: string;
};

export type AuditOpportunity = {
  title: string;
  detail: string;
  impact: "High" | "Medium";
};

export type AuditResult = {
  score: number;
  headline: string;
  opportunities: AuditOpportunity[];
  categories: AuditCategory[];
};

const clamp = (value: number) => Math.max(48, Math.min(91, value));

export function generateAudit(input: AuditInput): AuditResult {
  const hasTiktok = Boolean(input.tiktok?.trim());
  const hasSecureWebsite = input.website.startsWith("https://");
  const hasInstagram = input.instagram.includes("instagram");
  const base = input.restaurant.length + input.website.length + input.instagram.length;

  const visibility = clamp(62 + (hasSecureWebsite ? 8 : -5) + (base % 9));
  const conversion = clamp(58 + (input.website.length > 14 ? 7 : -4));
  const reputation = clamp(64 + (base % 13));
  const social = clamp(55 + (hasInstagram ? 9 : -8) + (hasTiktok ? 7 : -3));
  const retention = clamp(52 + (hasSecureWebsite ? 5 : -2));
  const score = Math.round((visibility + conversion + reputation + social + retention) / 5);

  return {
    score,
    headline: `${input.restaurant || "Your restaurant"} may be losing customers from these 3 issues.`,
    opportunities: [
      {
        title: "Put ordering and reservations above the fold",
        detail: "Mobile visitors should see Menu, Order, and Reserve before they scroll. Reducing that friction can recover high-intent guests who are deciding quickly.",
        impact: "High",
      },
      {
        title: hasTiktok ? "Turn best-selling dishes into weekly short-form hooks" : "Add short-form food videos to create craving",
        detail: "Your social presence should make one dish instantly memorable. Three simple videos per week can improve recall before weekend dinner decisions.",
        impact: "High",
      },
      {
        title: "Reply to recent negative reviews with a visible fix",
        detail: "Customers repeatedly scan owner responses for trust. Clear replies around wait times, service, or order accuracy can improve conversion and local ranking signals.",
        impact: "High",
      },
      {
        title: "Capture repeat guests before they leave",
        detail: "A simple email or SMS offer gives you an owned channel instead of relying on delivery apps, ads, or customers remembering to come back.",
        impact: "Medium",
      },
      {
        title: hasSecureWebsite ? "Strengthen local SEO intent on the homepage" : "Fix trust signals by moving the site to HTTPS",
        detail: hasSecureWebsite
          ? "Add cuisine, neighborhood, ordering, and reservation language where Google and customers can see it quickly."
          : "A non-secure site can quietly reduce trust and hurt conversion before guests even reach the menu.",
        impact: "Medium",
      },
    ],
    categories: [
      {
        name: "Visibility",
        score: visibility,
        issue: "Local search signals look underpowered.",
        why: "Hungry nearby customers often choose from the first few results.",
        fix: "Tighten Google profile details, hours, categories, and location keywords.",
      },
      {
        name: "Conversion",
        score: conversion,
        issue: "Visitors may not see the next step fast enough.",
        why: "Every extra tap can leak orders, bookings, and catering leads.",
        fix: "Put Order, Reserve, and Menu actions in the first screen on mobile.",
      },
      {
        name: "Reputation",
        score: reputation,
        issue: "Review response patterns need more consistency.",
        why: "Recent complaints shape trust more than old five-star reviews.",
        fix: "Reply to low-rated reviews and repeat the fix publicly.",
      },
      {
        name: "Social",
        score: social,
        issue: "The brand is not creating enough craving moments.",
        why: "Short, visual proof keeps your food in the customer’s head.",
        fix: "Post 3 quick food videos weekly with a clear visit/order prompt.",
      },
      {
        name: "Retention",
        score: retention,
        issue: "Returning visitors are not being captured.",
        why: "Owned channels lower your dependence on marketplaces and ads.",
        fix: "Add a simple loyalty, email, or SMS offer near menu and checkout.",
      },
    ],
  };
}
