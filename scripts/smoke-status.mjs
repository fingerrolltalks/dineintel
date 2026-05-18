const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://dineleak.app").replace(/\/+$/, "");
const cronSecret = process.env.CRON_SECRET?.trim() || "";

async function fetchOk(url, options) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options?.headers || {}),
      "user-agent": "dineleak-smoke-check/1.0",
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${url} -> ${response.status} ${response.statusText}${body ? ` | ${body.slice(0, 200)}` : ""}`);
  }

  return response;
}

async function main() {
  const targets = [baseUrl, `${baseUrl}/sitemap.xml`, `${baseUrl}/robots.txt`];

  for (const target of targets) {
    await fetchOk(target);
    console.log(`ok ${target}`);
  }

  if (cronSecret) {
    await fetchOk(`${baseUrl}/api/database/health`, {
      headers: { authorization: `Bearer ${cronSecret}` },
    });
    console.log(`ok ${baseUrl}/api/database/health`);
  } else {
    console.log("skip /api/database/health (CRON_SECRET not set)");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
