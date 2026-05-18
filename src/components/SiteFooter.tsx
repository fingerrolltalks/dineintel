import Link from "next/link";
import { Instagram } from "lucide-react";

const footerLinks = [
  { href: "/support", label: "Support" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/refund-policy", label: "Refund Policy" },
] as const;

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-white/8 bg-black/24">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 px-4 py-6 text-sm text-white/62 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="font-medium transition hover:text-white">
              {link.label}
            </Link>
          ))}
          <a
            href="https://www.instagram.com/dineleak/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-medium transition hover:text-white"
          >
            <Instagram size={15} />
            Instagram
          </a>
        </div>
        <p className="max-w-3xl text-xs leading-6 text-white/42">
          DineLeak provides AI-generated restaurant growth snapshots and recommendations. Reports are informational and not guaranteed to produce business, financial, legal, SEO, or revenue outcomes.
        </p>
      </div>
    </footer>
  );
}
