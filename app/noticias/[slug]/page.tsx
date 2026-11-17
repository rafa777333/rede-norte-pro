import { permanentRedirect, notFound } from "next/navigation";

export default async function LegacyNoticiasRedirectPage({
  params,
}: {
  params: { slug: string };
}) {
  if (!params?.slug) {
    notFound();
  }
  permanentRedirect(`/noticia/${encodeURIComponent(params.slug)}`);
}
