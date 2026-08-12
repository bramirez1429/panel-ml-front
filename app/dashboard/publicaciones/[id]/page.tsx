import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicationDetailHeader } from "@/components/publicaciones/publication-detail-header";
import { SharedVariations } from "@/components/publicaciones/shared-variations";
import { VariantPricingChildren } from "@/components/publicaciones/variant-pricing-children";
import { getPublicationDetail } from "@/lib/api/publication-detail";

export const metadata: Metadata = {
  title: "Detalle de publicación | ML Control",
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PublicationDetailPageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default async function PublicationDetailPage({
  params,
}: PublicationDetailPageProps) {
  const { id } = await params;

  if (!UUID_PATTERN.test(id)) {
    notFound();
  }

  const publication = await getPublicationDetail(id);

  if (!publication) {
    notFound();
  }

  return (
    <section className="publication-detail-page w-full min-w-0 space-y-6">
      <Link
        href="/dashboard/publicaciones"
        className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-dashboard-muted transition-colors hover:text-dashboard-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent"
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        Volver a publicaciones
      </Link>

      <PublicationDetailHeader publication={publication} />

      <section aria-labelledby="variants-heading" className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dashboard-accent-foreground">
            Inventario por variante
          </p>
          <h2
            id="variants-heading"
            className="mt-2 text-xl font-semibold tracking-tight text-dashboard-foreground sm:text-2xl"
          >
            {publication.model === "SHARED"
              ? "Variaciones compartidas"
              : "Variantes de la familia"}
          </h2>
          <p className="mt-1.5 text-sm text-dashboard-muted">
            {publication.model === "SHARED"
              ? "Stock, ventas y atributos guardados para cada variación."
              : "Publicaciones hijas y sus datos comerciales guardados."}
          </p>
        </div>

        {publication.model === "SHARED" ? (
          <SharedVariations variations={publication.sharedVariations} />
        ) : (
          <VariantPricingChildren items={publication.children} />
        )}
      </section>
    </section>
  );
}
