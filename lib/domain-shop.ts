import { resolveNs } from "node:dns/promises";
import { generateUrl, nameForUrlMake, nameToDotComHost, slugify } from "./url-guard";

export type DomainStatus = "available" | "taken" | "unknown";

export type DomainHit = {
  host: string;
  url: string;
  status: DomainStatus;
  registrars: { name: string; href: string }[];
};

export function registrarLinks(host: string) {
  const q = encodeURIComponent(host);
  return [
    { name: "GoDaddy", href: `https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=${q}` },
    { name: "Namecheap", href: `https://www.namecheap.com/domains/registration/results/?domain=${q}` },
    { name: "Porkbun", href: `https://porkbun.com/checkout/search?q=${q}` },
  ];
}

export function domainCandidates(input: string) {
  const source = nameForUrlMake(input) || input.trim();
  const primary = nameToDotComHost(source);
  if (!primary) return [];
  const label = primary.replace(/\.[a-z0-9]+$/i, "");
  const dashed = slugify(source).replace(/[^a-z0-9-]/g, "");
  const hosts = [
    `${label}.com`,
    `${label}.net`,
    `${label}.org`,
    `${label}.co`,
    dashed && dashed !== label ? `${dashed}.com` : "",
    `get${label}.com`,
  ].filter(Boolean);
  return [...new Set(hosts)].slice(0, 5);
}

async function rdapStatus(host: string): Promise<DomainStatus | null> {
  const tld = host.split(".").pop()?.toLowerCase() ?? "";
  const url =
    tld === "com" || tld === "net"
      ? `https://rdap.verisign.com/${tld}/v1/domain/${encodeURIComponent(host)}`
      : tld === "org"
        ? `https://rdap.publicinterestregistry.org/rdap/domain/${encodeURIComponent(host)}`
        : `https://rdap.org/domain/${encodeURIComponent(host)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/rdap+json, application/json",
        "User-Agent": "wb-domain-shop/1.0",
      },
    });
    if (response.status === 404) return "available";
    if (response.status === 200) return "taken";
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function dnsStatus(host: string): Promise<DomainStatus> {
  try {
    const records = await resolveNs(host);
    return records.length > 0 ? "taken" : "available";
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOTFOUND" || code === "ENODATA" || code === "ENONAME") return "available";
    return "unknown";
  }
}

export async function checkDomain(host: string): Promise<DomainStatus> {
  const rdap = await rdapStatus(host);
  if (rdap) return rdap;
  return dnsStatus(host);
}

export async function searchPublicDomains(input: string): Promise<{ query: string; hits: DomainHit[]; error?: string }> {
  const generated = generateUrl(input);
  if (!generated.ok) {
    return { query: input.trim(), hits: [], error: generated.error };
  }
  const hosts = domainCandidates(input);
  const hits = await Promise.all(
    hosts.map(async (host) => {
      const status = await checkDomain(host);
      return {
        host,
        url: `https://${host}`,
        status,
        registrars: registrarLinks(host),
      } satisfies DomainHit;
    }),
  );
  hits.sort((a, b) => {
    const rank = { available: 0, unknown: 1, taken: 2 };
    return rank[a.status] - rank[b.status];
  });
  return { query: generated.host || generated.url, hits };
}

export function formatDomainSearch(result: { query: string; hits: DomainHit[]; error?: string }) {
  if (result.error) return result.error;
  if (result.hits.length === 0) return "Type a name and I will search the public internet for a real .com.";
  const lines = [
    "A made-up string is not a working internet address. Buy the domain at a real registrar (GoDaddy, Namecheap, or Porkbun). After you pay them, that URL works on every phone, app, and browser.",
  ];
  for (const hit of result.hits) {
    const state = hit.status === "available" ? "AVAILABLE to register" : hit.status === "taken" ? "already taken" : "status unclear";
    const buy = hit.registrars[0]?.href;
    lines.push(`• ${hit.host} — ${state}${hit.status !== "taken" && buy ? `. Get it: ${buy}` : ""}`);
  }
  return lines.join("\n");
}
