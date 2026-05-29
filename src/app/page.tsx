import type { Metadata } from "next";
import AuditApp from "@/components/AuditApp";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return <AuditApp />;
}
