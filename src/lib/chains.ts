const CHAIN_NAMES = [
  "starbucks",
  "costa coffee",
  "costa",
  "mcdonalds",
  "mcdonald's",
  "kfc",
  "burger king",
  "subway",
  "nandos",
  "nando's",
  "pret a manger",
  "pret",
  "greggs",
  "tesco",
  "sainsbury",
  "asda",
  "morrisons",
  "waitrose",
  "aldi",
  "lidl",
  "co-op",
  "coop food",
  "boots",
  "superdrug",
  "whsmith",
  "wh smith",
  "waterstones",
  "tesco express",
  "sainsbury's local",
  "pizza hut",
  "domino's",
  "dominos",
  "papa johns",
  "papa john's",
  "five guys",
  "wetherspoon",
  "j d wetherspoon",
  "lloyds",
  "halifax",
  "barclays",
  "hsbc",
  "natwest",
  "santander",
  "nationwide",
  "o2",
  "vodafone",
  "specsavers",
  "vision express",
  "tesco mobile",
  "poundland",
  "home bargains",
  "b&m",
  "wilko",
  "primark",
  "tk maxx",
  "primark",
  "zara",
  "uniqlo",
  "ikea",
  "pizza express",
  "wagamama",
  "cafe nero",
  "caffe nero",
  "nero",
  "dunkin",
  "tim hortons",
  "walmart",
  "target",
  "cvs",
  "walgreens",
  "7-eleven",
  "shell",
  "bp",
  "esso",
  "texaco",
];

const SKIP_AMENITIES = new Set(["atm", "bank", "bureau_de_change", "embassy", "post_box", "telephone", "parking"]);
const SKIP_OFFICES = new Set(["diplomatic", "government", "ngo"]);

export function isSkipBusiness(name: string, tags: Record<string, string>) {
  if (tags["brand:wikidata"] || tags["operator:wikidata"]) return true;
  if (SKIP_AMENITIES.has(tags.amenity || "")) return true;
  if (SKIP_OFFICES.has(tags.office || "")) return true;
  if ((tags.leisure || "") === "pitch") return true;
  const names = [name, tags.brand, tags.operator].filter(Boolean) as string[];
  return names.some((value) => {
    const lower = value.toLowerCase().trim();
    if (/^(embassy|high commission|consulate|honorary consulate)\b/.test(lower)) return true;
    return CHAIN_NAMES.some((raw) => {
      const chain = raw.trim();
      if (lower === chain) return true;
      if (lower.startsWith(`${chain} `) || lower.startsWith(`${chain}-`)) return true;
      return chain.length >= 6 && (lower.includes(` ${chain} `) || lower.endsWith(` ${chain}`));
    });
  });
}

export function independentBoost(category: string) {
  const key = category.toLowerCase();
  const hot = [
    "hairdresser",
    "beauty",
    "cosmetics",
    "tattoo",
    "barber",
    "florist",
    "butcher",
    "bakery",
    "convenience",
    "car repair",
    "car_repair",
    "laundry",
    "dry_cleaning",
    "massage",
    "physiotherapist",
    "dentist",
    "veterinary",
    "craft",
    "electrician",
    "plumber",
    "joiner",
    "painter",
    "gym",
    "fitness centre",
    "fitness_centre",
  ];
  return hot.some((item) => key.includes(item)) ? 12 : 0;
}
