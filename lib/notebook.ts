import { z } from "zod";

export const notebookEntrySchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().max(80).default(""),
  businessName: z.string().max(120).default(""),
  phone: z.string().max(80).default(""),
  email: z.string().max(200).default(""),
  createdAt: z.string().min(1),
});

export const notebookSchema = z.object({
  version: z.literal(1),
  entries: z.array(notebookEntrySchema).max(500),
});

export type NotebookEntry = z.infer<typeof notebookEntrySchema>;
export type Notebook = z.infer<typeof notebookSchema>;

export function emptyNotebook(): Notebook {
  return { version: 1, entries: [] };
}

export function parseNotebook(input: unknown): Notebook {
  return notebookSchema.parse(input);
}

export function normalizeEntry(input: {
  name?: string;
  businessName?: string;
  phone?: string;
  email?: string;
}) {
  const name = input.name?.trim() ?? "";
  const businessName = input.businessName?.trim() ?? "";
  const phone = input.phone?.trim() ?? "";
  const email = input.email?.trim() ?? "";
  return { name, businessName, phone, email };
}

export function entryIsEmpty(entry: { name: string; businessName: string; phone: string; email: string }) {
  return !entry.name && !entry.businessName && !entry.phone && !entry.email;
}
