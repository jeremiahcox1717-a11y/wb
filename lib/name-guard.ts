export type NameScan = {
  answer: "yes" | "no";
  name?: string;
  matches?: string[];
  reasons: string[];
};

export function normalizeName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ");
}

export function namesMatch(a: string, b: string) {
  return Boolean(a && b && normalizeName(a) === normalizeName(b));
}

export function titleMatchesName(title: string, name: string) {
  const n = normalizeName(name);
  const t = normalizeName(title.replace(/\s*\([^)]*\)\s*$/, ""));
  return t === n || t.startsWith(`${n} `);
}

export function looksLikePerson(text: string) {
  return /\b(person|people|human|actor|actress|singer|rapper|politician|footballer|soccer|player|writer|author|journalist|musician|artist|ceo|founder|criminal|murder|activist|scientist|professor|athlete|coach|model)\b/i.test(
    text,
  );
}

export function looksLikeNameQuestion(text: string) {
  return (
    /\b(scan|check|taken|used|same)\b.+\bname\b/i.test(text) ||
    /\bsomeone else\b.+\bname\b/i.test(text) ||
    /\bname scanner\b/i.test(text)
  );
}

export function extractNameQuery(text: string) {
  const quoted = text.match(/["“]([^"”]{2,80})["”]/);
  if (quoted?.[1]) return quoted[1].trim();
  const after = text.match(
    /\b(?:name|called|named)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\b/,
  );
  if (after?.[1]) return after[1].trim();
  if (/^[A-Za-z][A-Za-z .'-]{1,79}$/.test(text.trim())) return text.trim();
  return null;
}

export function scanNameLocal(raw: string, ownerName: string): NameScan {
  const name = raw.trim().replace(/\s+/g, " ");
  if (!name) {
    return { answer: "no", reasons: ["Type a name first."] };
  }
  if (name.length > 80) {
    return { answer: "no", reasons: ["That name is too long to check."] };
  }
  if (namesMatch(name, ownerName)) {
    return {
      answer: "no",
      name: ownerName,
      reasons: ["This is the owner of this site. Someone else does not have it here."],
    };
  }
  return {
    answer: "no",
    name,
    reasons: ["No local match. Checking public records next."],
  };
}

export function formatNameAnswer(scan: NameScan) {
  const word = scan.answer === "yes" ? "YES" : "NO";
  const why = scan.reasons.join(" ");
  return `${word}. ${why}`.trim();
}
