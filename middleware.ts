import { NextRequest, NextResponse } from "next/server";

const canonicalHost = "dineleak.app";
const redirectHosts = new Set(["dineintel.app", "dineleak.dev"]);

export function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname.toLowerCase();

  if (!redirectHosts.has(hostname)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.hostname = canonicalHost;
  url.port = "";

  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: ["/:path*"],
};
