"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function MetaPixel() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window.fbq !== "function") return;

    window.fbq("track", "PageView", { page_path: pathname });
  }, [pathname]);

  return null;
}
