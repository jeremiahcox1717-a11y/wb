export type HuntMode = "ghosts" | "instagram" | "all";

export type Presence =
  | "none"
  | "social_only"
  | "booking_only"
  | "real_website";

export type GoogleStatus =
  | "unchecked"
  | "not_found"
  | "listed_no_website"
  | "listed_with_website";

export type LeadKind = "ghost" | "unclaimed" | "instagram" | "thin";

export type Settings = {
  defaultCountry: "uk" | "us";
  defaultRadius: number;
  skipWholeOutcode: boolean;
  lockedArea: string;
};

export type PostcodeRecord = {
  postcode: string;
  outcode: string;
  country: string;
  region?: string;
  district?: string;
  area?: string;
  lat: number;
  lon: number;
  issuedAt: string;
};

export type SavedLead = {
  id: string;
  name: string;
  kind: LeadKind;
  category: string;
  address?: string;
  postcode?: string;
  phone?: string;
  instagram?: string;
  website?: string;
  notes: string;
  status: "new" | "contacted" | "won" | "skip";
  savedAt: string;
};

export type BusinessLead = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  category: string;
  address?: string;
  postcode?: string;
  phone?: string;
  email?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  presence: Presence;
  google: GoogleStatus;
  googlePlaceId?: string;
  googleMapsUrl?: string;
  kind: LeadKind;
  score: number;
  reasons: string[];
  osmUrl: string;
};

export type HuntResult = {
  lookup: PostcodeRecord;
  radiusMeters: number;
  mode: HuntMode;
  scanned: number;
  qualified: number;
  leads: BusinessLead[];
  googleEnabled: boolean;
};
