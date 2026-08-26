import { notFound } from "next/navigation";
import { SiteView } from "@/components/site-view";
import { publicUrlFor, readProject } from "@/lib/projects";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await readProject(slug);
  if (!project) return { title: "Site" };
  return {
    title: project.site.seo.title || project.name,
    description: project.site.seo.description,
    robots: { index: true, follow: true },
  };
}

export default async function PublicClientSitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await readProject(slug);
  if (!project) notFound();
  const page =
    project.site.pages.find((item) => item.slug === "/") ??
    project.site.pages[0];
  if (!page) notFound();
  return <SiteView site={project.site} page={page} homeHref={publicUrlFor(project.slug)} publicSite />;
}
