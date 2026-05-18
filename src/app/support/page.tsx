import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { LegalPageShell } from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with DineLeak reports, subscriptions, access, and billing.",
};

export default function SupportPage() {
  return (
    <LegalPageShell
      eyebrow="Support"
      title="Need help with your DineLeak account?"
      intro="Send us a message and we’ll help with access, billing, or report questions as quickly as possible."
    >
      <p>
        DineLeak provides AI-generated restaurant growth snapshots and recommendations. Reports are informational and not guaranteed to produce business, financial, legal, SEO, or revenue outcomes.
      </p>
      <p>
        For support, email{" "}
        <a href="mailto:dineleak@gmail.com" className="text-lime transition hover:text-white">
          dineleak@gmail.com
        </a>
        .
      </p>
      <p>
        Follow updates on{" "}
        <a href="https://instagram.com/DynLeak" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-lime transition hover:text-white">
          Instagram
          <ExternalLink size={14} />
        </a>{" "}
        or @DynLeak.
      </p>
    </LegalPageShell>
  );
}
