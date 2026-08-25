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
            border: hit.status === "available" ? "1px solid #f2f2f0" : "1px solid var(--wb-border, #2a2a2c)",
            borderRadius: "var(--wb-radius-btn, 2px)",
            background: hit.status === "available" ? "#161617" : "transparent",
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
            style={{ color: hit.status === "available" ? "#f2f2f0" : "var(--wb-muted, #a3a39b)" }}
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
                  background: shop.name === "GoDaddy" && hit.status !== "taken" ? "#f2f2f0" : "transparent",
                  color: shop.name === "GoDaddy" && hit.status !== "taken" ? "#111111" : "#f2f2f0",
                  border: "1px solid #f2f2f0",
                  borderRadius: "var(--wb-radius-btn, 2px)",
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
