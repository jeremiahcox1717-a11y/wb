import type { DomainHit } from "@/lib/domain-shop";

function statusCopy(status: DomainHit["status"]) {
  if (status === "available") return "Available — register it to use it everywhere";
  if (status === "taken") return "Taken — someone already owns this";
  return "Could not confirm — check at a registrar";
}

export function DomainHits({
  hits,
  compact = false,
  listId,
}: {
  hits: DomainHit[];
  compact?: boolean;
  listId?: string;
}) {
  if (!hits.length) return null;

  return (
    <ul id={listId} className={compact ? "mt-2 space-y-2" : "mt-4 space-y-3"}>
      {hits.map((hit) => (
        <li
          key={hit.host}
          className={compact ? "px-2 py-2" : "px-3 py-3"}
          style={{
            border: hit.status === "available" ? "1px solid var(--wb-accent, #d4a574)" : "1px solid var(--wb-border, #3a3128)",
            borderRadius: "var(--wb-radius-btn, 18px)",
            background: hit.status === "available" ? "var(--wb-surface, #1e1914)" : "transparent",
          }}
        >
          <p
            className={compact ? "break-all text-sm" : "break-all text-lg"}
            style={{ fontFamily: compact ? "inherit" : "var(--wb-display)" }}
          >
            {hit.host}
          </p>
          <p
            className={compact ? "mt-0.5 text-[10px] tracking-[0.14em] uppercase" : "mt-1 text-xs tracking-[0.16em] uppercase"}
            style={{ color: hit.status === "available" ? "var(--wb-accent, #d4a574)" : "var(--wb-muted, #b9a89a)" }}
          >
            {statusCopy(hit.status)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {hit.registrars.map((shop) => (
              <a
                key={shop.name}
                href={shop.href}
                target="_blank"
                rel="noreferrer"
                className={compact ? "px-2 py-1 text-[10px] font-semibold no-underline" : "px-3 py-1.5 text-xs font-semibold no-underline"}
                style={{
                  background: shop.name === "GoDaddy" && hit.status !== "taken" ? "var(--wb-accent, #d4a574)" : "transparent",
                  color: shop.name === "GoDaddy" && hit.status !== "taken" ? "var(--wb-accent-text, #1a140f)" : "var(--wb-accent, #d4a574)",
                  border: "1px solid var(--wb-accent, #d4a574)",
                  borderRadius: "var(--wb-radius-btn, 18px)",
                }}
              >
                Get on {shop.name}
              </a>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
