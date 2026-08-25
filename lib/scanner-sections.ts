import { parseSite, type Site, type SiteSection } from "./schema";

export const urlMakerSection: SiteSection = {
  id: "url-make",
  type: "urlMaker",
  heading: "URL maker",
  body: "Type a name. I’ll make it into a .com address — Jordan Bennett becomes jordanbennett.com.",
};

export const urlScannerSection: SiteSection = {
  id: "url-scan",
  type: "urlScanner",
  heading: "URL scanner",
  body: "Paste a link someone sent you. The answer is YES or NO.",
};

export const nameScannerSection: SiteSection = {
  id: "name-scan",
  type: "nameScanner",
  heading: "Name scanner",
  body: "Type a name. YES means someone else already uses it publicly. NO means no public match, or it is the owner of this site.",
};

export const currencyCalculatorSection: SiteSection = {
  id: "currency",
  type: "currencyCalculator",
  heading: "Currency calculator",
  body: "Type a currency on both sides, or pick from the lists. Convert either way and see every live rate.",
};

export const notebookSection: SiteSection = {
  id: "notebook",
  type: "notebook",
  heading: "Notebook",
  body: "Save a person’s name, business, phone number, and email. Only you can see this list.",
};

function upsertBeforeFooter(sections: SiteSection[], section: SiteSection) {
  const existing = sections.findIndex((item) => item.type === section.type);
  if (existing >= 0) {
    sections[existing] = { ...sections[existing], ...section, id: sections[existing].id || section.id };
    return;
  }
  const footerIndex = sections.findIndex((item) => item.type === "footer");
  const insertAt = footerIndex >= 0 ? footerIndex : sections.length;
  sections.splice(insertAt, 0, section);
}

export function ensureScannerSections(site: Site): Site {
  const next = parseSite(JSON.parse(JSON.stringify(site)));
  const page = next.pages.find((item) => item.slug === "/") ?? next.pages[0];
  if (!page) return next;
  upsertBeforeFooter(page.sections, urlMakerSection);
  upsertBeforeFooter(page.sections, urlScannerSection);
  upsertBeforeFooter(page.sections, nameScannerSection);
  upsertBeforeFooter(page.sections, currencyCalculatorSection);
  upsertBeforeFooter(page.sections, notebookSection);

  const extras = [
    { label: "URL make", href: "#url-make" },
    { label: "URL scan", href: "#url-scan" },
    { label: "Name scan", href: "#name-scan" },
    { label: "Currency", href: "#currency" },
    { label: "Notebook", href: "#notebook" },
  ];
  for (const link of extras) {
    if (!next.nav.some((item) => item.href === link.href)) {
      const contact = next.nav.findIndex((item) => item.href === "#contact");
      if (contact >= 0) next.nav.splice(contact, 0, link);
      else next.nav.push(link);
    }
  }
  return parseSite(next);
}
