import type { Metadata } from "next";
import { LegalPageShell } from "@/components/LegalPageShell";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Refund policy for DineLeak digital reports and subscriptions.",
};

export default function RefundPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Refund Policy"
      title="Refunds and cancellations"
      intro="This policy is designed to keep digital access simple and clear."
    >
      <p>
        Digital reports are generally non-refundable after access is delivered because the content is available instantly after checkout.
      </p>
      <p>
        Subscription cancellations stop future billing. You can cancel recurring monitoring at any time through Stripe or by contacting support.
      </p>
      <p>
        Support requests can be reviewed case-by-case if there is a billing issue, duplicate charge, or access problem.
      </p>
      <p>
        For refund questions, email{" "}
        <a href="mailto:dineleak@gmail.com" className="text-lime transition hover:text-white">
          dineleak@gmail.com
        </a>
        .
      </p>
    </LegalPageShell>
  );
}
