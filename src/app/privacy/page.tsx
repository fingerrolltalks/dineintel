import type { Metadata } from "next";
import { LegalPageShell } from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for DineLeak data collection, reporting, and support.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Privacy Policy"
      title="How DineLeak handles information"
      intro="This policy explains the basic data used to generate restaurant growth snapshots and monitoring alerts."
    >
      <p>
        DineLeak provides AI-generated restaurant growth snapshots and recommendations. To generate reports, we may process the restaurant name, website, social links, city, and public website content that you submit.
      </p>
      <p>
        We may also store checkout, audit, and subscription records so we can deliver reports, recurring monitoring, support, and access management.
      </p>
      <p>
        Reports are informational and not guaranteed to produce business, financial, legal, SEO, or revenue outcomes.
      </p>
      <p>
        For help with privacy questions, contact{" "}
        <a href="mailto:dineleak@gmail.com" className="text-lime transition hover:text-white">
          dineleak@gmail.com
        </a>
        .
      </p>
    </LegalPageShell>
  );
}
