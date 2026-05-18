import type { Metadata } from "next";
import { LegalPageShell } from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for using DineLeak reports, subscriptions, and support.",
};

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Terms of Service"
      title="DineLeak terms"
      intro="These terms cover access to reports, recurring monitoring, and general service use."
    >
      <p>
        DineLeak provides AI-generated restaurant growth snapshots and recommendations. Reports are informational and not guaranteed to produce business, financial, legal, SEO, or revenue outcomes.
      </p>
      <p>
        Paid digital reports are delivered instantly after checkout. Subscription plans provide recurring AI monitoring based on available website data and any connected sources we support.
      </p>
      <p>
        Subscription cancellations stop future billing. Existing access remains active until the end of the current paid period unless Stripe indicates otherwise.
      </p>
      <p>
        Do not use DineLeak for unlawful, abusive, or harmful activity. We may suspend access if a purchase or account is being misused.
      </p>
    </LegalPageShell>
  );
}
