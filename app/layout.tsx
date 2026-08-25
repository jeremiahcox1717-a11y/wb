import type { Metadata } from "next";
import { readSite } from "@/lib/store";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await readSite();
  return {
    title: site.seo.title,
    description: site.seo.description,
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
