import type { CSSProperties } from "react";
import Link from "next/link";
import { CurrencyCalculator } from "@/components/currency-calculator";
import { NameScannerSection } from "@/components/name-scanner-section";
import { NotebookSection } from "@/components/notebook-section";
import { UrlScannerSection } from "@/components/url-scanner-section";
import type { Site, SitePage, SiteSection } from "@/lib/schema";
import { radiusValue } from "@/lib/schema";

function googleFontHref(display: string, body: string) {
  const families = [...new Set([display, body])]
    .map((name) => `family=${encodeURIComponent(name).replace(/%20/g, "+")}:ital,wght@0,400;0,600;0,700;1,400`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

function themeVars(site: Site): CSSProperties {
  const radiusCard = radiusValue(site.theme.radius, "card");
  const radiusButton = radiusValue(site.theme.radius, "button");
  return {
    background: site.theme.background,
    color: site.theme.text,
    fontFamily: `"${site.theme.fontBody}", system-ui, sans-serif`,
    ["--wb-bg" as string]: site.theme.background,
    ["--wb-surface" as string]: site.theme.surface,
    ["--wb-text" as string]: site.theme.text,
    ["--wb-muted" as string]: site.theme.muted,
    ["--wb-accent" as string]: site.theme.accent,
    ["--wb-accent-text" as string]: site.theme.accentText,
    ["--wb-border" as string]: site.theme.border,
    ["--wb-radius" as string]: radiusCard,
    ["--wb-radius-btn" as string]: radiusButton,
    ["--wb-display" as string]: `"${site.theme.fontDisplay}", Georgia, serif`,
  };
}

function Display({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={className} style={{ fontFamily: "var(--wb-display)" }}>
      {children}
    </span>
  );
}

function Button({ href, children, tone }: { href: string; children: React.ReactNode; tone: "primary" | "ghost" }) {
  const primary = tone === "primary";
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center px-5 py-3 text-sm font-semibold tracking-wide no-underline transition-opacity hover:opacity-80"
      style={{
        borderRadius: "var(--wb-radius-btn)",
        background: primary ? "var(--wb-accent)" : "transparent",
        color: primary ? "var(--wb-accent-text)" : "var(--wb-text)",
        border: primary ? "0" : "1px solid var(--wb-border)",
      }}
    >
      {children}
    </a>
  );
}

function SectionFrame({ id, children, compact }: { id?: string; children: React.ReactNode; compact?: boolean }) {
  return (
    <section id={id} className={`mx-auto w-full px-6 md:px-10 ${compact ? "max-w-7xl py-8" : "max-w-6xl py-20"}`}>
      {children}
    </section>
  );
}

function Hero({ section }: { section: Extract<SiteSection, { type: "hero" }> }) {
  const layout = section.layout ?? "cinematic";
  const copy = (
    <div className={layout === "centered" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {section.kicker ? (
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em]" style={{ color: "var(--wb-accent)" }}>
          {section.kicker}
        </p>
      ) : null}
      <h1 className="text-5xl leading-[1.05] font-semibold tracking-tight md:text-7xl">
        <Display>{section.heading}</Display>
      </h1>
      {section.subheading ? (
        <p className="mt-6 max-w-2xl text-lg leading-8" style={{ color: "var(--wb-muted)" }}>
          {section.subheading}
        </p>
      ) : null}
      <div className={`mt-10 flex flex-wrap gap-3 ${layout === "centered" ? "justify-center" : ""}`}>
        {section.primaryCta ? (
          <Button href={section.primaryCta.href} tone="primary">
            {section.primaryCta.label}
          </Button>
        ) : null}
        {section.secondaryCta ? (
          <Button href={section.secondaryCta.href} tone="ghost">
            {section.secondaryCta.label}
          </Button>
        ) : null}
      </div>
    </div>
  );

  if (layout === "split" && section.image) {
    return (
      <section className="mx-auto grid min-h-[80vh] w-full max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:px-10">
        {copy}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={section.image}
          alt=""
          className="h-[28rem] w-full object-cover"
          style={{ borderRadius: "var(--wb-radius)", border: "1px solid var(--wb-border)" }}
        />
      </section>
    );
  }

  return (
    <section
      className={`flex min-h-[88vh] items-end px-6 py-24 md:px-10 ${layout === "centered" ? "justify-center text-center" : ""}`}
    >
      <div className="mx-auto w-full max-w-6xl">{copy}</div>
    </section>
  );
}

function renderSection(section: SiteSection, site: Site) {
  switch (section.type) {
    case "hero":
      return <Hero key="hero" section={section} />;
    case "features":
      return (
        <SectionFrame key={section.id ?? "features"} id={section.id}>
          {section.heading ? (
            <h2 className="text-3xl md:text-5xl">
              <Display>{section.heading}</Display>
            </h2>
          ) : null}
          {section.subheading ? (
            <p className="mt-4 max-w-2xl text-base" style={{ color: "var(--wb-muted)" }}>
              {section.subheading}
            </p>
          ) : null}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {section.items.map((item) => (
              <article
                key={item.title}
                className="p-6"
                style={{
                  background: "var(--wb-surface)",
                  border: "1px solid var(--wb-border)",
                  borderRadius: "var(--wb-radius)",
                }}
              >
                <h3 className="text-xl">
                  <Display>{item.title}</Display>
                </h3>
                <p className="mt-3 text-sm leading-6" style={{ color: "var(--wb-muted)" }}>
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </SectionFrame>
      );
    case "richtext":
      return (
        <SectionFrame key={section.id ?? "richtext"} id={section.id}>
          <div className="grid gap-8 md:grid-cols-[0.4fr_0.6fr]">
            <div>
              {section.eyebrow ? (
                <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--wb-accent)" }}>
                  {section.eyebrow}
                </p>
              ) : null}
              {section.heading ? (
                <h2 className="mt-3 text-3xl md:text-5xl">
                  <Display>{section.heading}</Display>
                </h2>
              ) : null}
            </div>
            <p className="text-lg leading-8" style={{ color: "var(--wb-muted)" }}>
              {section.body}
            </p>
          </div>
        </SectionFrame>
      );
    case "gallery":
      return (
        <SectionFrame key={section.id ?? "gallery"} id={section.id}>
          {section.heading ? (
            <h2 className="mb-10 text-3xl md:text-5xl">
              <Display>{section.heading}</Display>
            </h2>
          ) : null}
          <div className="grid gap-4 md:grid-cols-3">
            {section.items.map((item) => (
              <figure key={item.image + (item.title ?? "")} className="overflow-hidden" style={{ borderRadius: "var(--wb-radius)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.title ?? ""} className="aspect-[4/5] w-full object-cover" />
                {item.title || item.caption ? (
                  <figcaption className="px-1 pt-3 text-sm" style={{ color: "var(--wb-muted)" }}>
                    {item.title}
                    {item.caption ? ` — ${item.caption}` : ""}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        </SectionFrame>
      );
    case "testimonials":
      return (
        <SectionFrame key={section.id ?? "testimonials"} id={section.id}>
          {section.heading ? (
            <h2 className="mb-10 text-3xl md:text-5xl">
              <Display>{section.heading}</Display>
            </h2>
          ) : null}
          <div className="grid gap-6 md:grid-cols-2">
            {section.items.map((item) => (
              <blockquote
                key={item.name + item.quote}
                className="p-6"
                style={{
                  background: "var(--wb-surface)",
                  border: "1px solid var(--wb-border)",
                  borderRadius: "var(--wb-radius)",
                }}
              >
                <p className="text-xl leading-8">
                  <Display>“{item.quote}”</Display>
                </p>
                <footer className="mt-4 text-sm" style={{ color: "var(--wb-muted)" }}>
                  {item.name}
                  {item.role ? ` · ${item.role}` : ""}
                </footer>
              </blockquote>
            ))}
          </div>
        </SectionFrame>
      );
    case "pricing":
      return (
        <SectionFrame key={section.id ?? "pricing"} id={section.id}>
          {section.heading ? (
            <h2 className="text-3xl md:text-5xl">
              <Display>{section.heading}</Display>
            </h2>
          ) : null}
          {section.subheading ? (
            <p className="mt-4 max-w-2xl" style={{ color: "var(--wb-muted)" }}>
              {section.subheading}
            </p>
          ) : null}
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {section.plans.map((plan) => (
              <article
                key={plan.name}
                className="flex flex-col p-6"
                style={{
                  background: "var(--wb-surface)",
                  border: plan.featured ? "2px solid var(--wb-accent)" : "1px solid var(--wb-border)",
                  borderRadius: "var(--wb-radius)",
                }}
              >
                <h3 className="text-2xl">
                  <Display>{plan.name}</Display>
                </h3>
                <p className="mt-2 text-3xl font-semibold">{plan.price}</p>
                {plan.description ? (
                  <p className="mt-2 text-sm" style={{ color: "var(--wb-muted)" }}>
                    {plan.description}
                  </p>
                ) : null}
                <ul className="mt-6 flex-1 space-y-2 text-sm" style={{ color: "var(--wb-muted)" }}>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                {plan.cta ? (
                  <div className="mt-8">
                    <Button href={plan.cta.href} tone={plan.featured ? "primary" : "ghost"}>
                      {plan.cta.label}
                    </Button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </SectionFrame>
      );
    case "faq":
      return (
        <SectionFrame key={section.id ?? "faq"} id={section.id}>
          {section.heading ? (
            <h2 className="mb-8 text-3xl md:text-5xl">
              <Display>{section.heading}</Display>
            </h2>
          ) : null}
          <div className="divide-y" style={{ borderColor: "var(--wb-border)" }}>
            {section.items.map((item) => (
              <details key={item.question} className="py-5">
                <summary className="cursor-pointer text-lg font-medium">{item.question}</summary>
                <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: "var(--wb-muted)" }}>
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </SectionFrame>
      );
    case "stats":
      return (
        <SectionFrame key={section.id ?? "stats"} id={section.id}>
          <div className="grid gap-8 md:grid-cols-3">
            {section.items.map((item) => (
              <div key={item.label}>
                <p className="text-4xl md:text-5xl">
                  <Display>{item.value}</Display>
                </p>
                <p className="mt-2 text-sm" style={{ color: "var(--wb-muted)" }}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </SectionFrame>
      );
    case "cta":
      return (
        <SectionFrame key={section.id ?? "cta"} id={section.id}>
          <div
            className="flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center"
            style={{
              background: "var(--wb-surface)",
              border: "1px solid var(--wb-border)",
              borderRadius: "var(--wb-radius)",
            }}
          >
            <div>
              <h2 className="text-3xl">
                <Display>{section.heading}</Display>
              </h2>
              {section.body ? (
                <p className="mt-2" style={{ color: "var(--wb-muted)" }}>
                  {section.body}
                </p>
              ) : null}
            </div>
            <Button href={section.cta.href} tone="primary">
              {section.cta.label}
            </Button>
          </div>
        </SectionFrame>
      );
    case "contact":
      return (
        <SectionFrame key={section.id ?? "contact"} id={section.id ?? "contact"}>
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-3xl md:text-5xl">
                <Display>{section.heading ?? "Contact"}</Display>
              </h2>
              {section.body ? (
                <p className="mt-4 text-lg" style={{ color: "var(--wb-muted)" }}>
                  {section.body}
                </p>
              ) : null}
            </div>
            <div className="space-y-3 text-base" style={{ color: "var(--wb-muted)" }}>
              {site.identity.email ? (
                <p>
                  <a href={`mailto:${site.identity.email}`} className="underline decoration-transparent hover:decoration-current">
                    {site.identity.email}
                  </a>
                </p>
              ) : null}
              {site.identity.phone ? <p>{site.identity.phone}</p> : null}
              {site.identity.location ? <p>{site.identity.location}</p> : null}
              {!site.identity.email && !site.identity.phone && !site.identity.location ? (
                <p>Add an email, phone, or city from the studio and it will show up here.</p>
              ) : null}
              {site.identity.socials.length > 0 ? (
                <ul className="flex flex-wrap gap-4 pt-2">
                  {site.identity.socials.map((social) => (
                    <li key={social.href}>
                      <a href={social.href} className="underline">
                        {social.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </SectionFrame>
      );
    case "team":
      return (
        <SectionFrame key={section.id ?? "team"} id={section.id}>
          {section.heading ? (
            <h2 className="mb-10 text-3xl md:text-5xl">
              <Display>{section.heading}</Display>
            </h2>
          ) : null}
          <div className="grid gap-6 md:grid-cols-3">
            {section.members.map((member) => (
              <article
                key={member.name}
                className="p-6"
                style={{
                  background: "var(--wb-surface)",
                  border: "1px solid var(--wb-border)",
                  borderRadius: "var(--wb-radius)",
                }}
              >
                <h3 className="text-xl">
                  <Display>{member.name}</Display>
                </h3>
                {member.role ? (
                  <p className="mt-1 text-sm" style={{ color: "var(--wb-accent)" }}>
                    {member.role}
                  </p>
                ) : null}
                {member.bio ? (
                  <p className="mt-3 text-sm" style={{ color: "var(--wb-muted)" }}>
                    {member.bio}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </SectionFrame>
      );
    case "urlScanner":
      return (
        <SectionFrame key={section.id ?? "urlScanner"} id={section.id} compact>
          <UrlScannerSection heading={section.heading} body={section.body} />
        </SectionFrame>
      );
    case "nameScanner":
      return (
        <SectionFrame key={section.id ?? "nameScanner"} id={section.id}>
          <NameScannerSection heading={section.heading} body={section.body} />
        </SectionFrame>
      );
    case "currencyCalculator":
      return (
        <SectionFrame key={section.id ?? "currencyCalculator"} id={section.id} compact>
          <CurrencyCalculator heading={section.heading} body={section.body} />
        </SectionFrame>
      );
    case "notebook":
      return (
        <SectionFrame key={section.id ?? "notebook"} id={section.id}>
          <NotebookSection heading={section.heading} body={section.body} />
        </SectionFrame>
      );
    case "footer":
      return (
        <footer
          key="footer"
          className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-10 text-sm md:px-10"
          style={{ color: "var(--wb-muted)", borderTop: "1px solid var(--wb-border)" }}
        >
          <span>{section.note || site.identity.siteName}</span>
          <span>{new Date().getFullYear()}</span>
        </footer>
      );
    default:
      return null;
  }
}

export function SiteView({
  site,
  page,
  preview = false,
}: {
  site: Site;
  page: SitePage;
  preview?: boolean;
}) {
  return (
    <div className={preview ? "min-h-full" : "min-h-screen"} style={themeVars(site)}>
      {/* Google Fonts are chosen by the live site JSON, so they cannot be bundled at build time. */}
      <link rel="stylesheet" href={googleFontHref(site.theme.fontDisplay, site.theme.fontBody)} />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 md:px-10">
        {preview ? (
          <span className="text-lg tracking-tight">
            <Display>{site.identity.siteName}</Display>
          </span>
        ) : (
          <Link href="/" className="text-lg tracking-tight no-underline" style={{ color: "var(--wb-text)" }}>
            <Display>{site.identity.siteName}</Display>
          </Link>
        )}
        <nav className="hidden gap-6 text-sm md:flex" style={{ color: "var(--wb-muted)" }}>
          {site.nav.map((item) =>
            preview ? (
              <span key={item.href + item.label}>{item.label}</span>
            ) : (
              <a key={item.href + item.label} href={item.href} className="no-underline hover:opacity-70">
                {item.label}
              </a>
            ),
          )}
        </nav>
        <details className="md:hidden">
          <summary className="cursor-pointer text-sm">Menu</summary>
          <div
            className="absolute right-6 mt-3 flex flex-col gap-2 p-4 text-sm"
            style={{ background: "var(--wb-surface)", borderRadius: "var(--wb-radius)" }}
          >
            {site.nav.map((item) =>
              preview ? (
                <span key={item.href + item.label}>{item.label}</span>
              ) : (
                <a key={item.href + item.label} href={item.href}>
                  {item.label}
                </a>
              ),
            )}
          </div>
        </details>
      </header>
      <main>{page.sections.map((section) => renderSection(section, site))}</main>
    </div>
  );
}
