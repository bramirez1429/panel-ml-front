import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicationDetailHeader } from "@/components/publicaciones/publication-detail-header";
import { PublicationActivity } from "@/components/publicaciones/publication-activity";
import { PublicationCommercialSummary } from "@/components/publicaciones/publication-commercial-summary";
import { PublicationContent } from "@/components/publicaciones/publication-content";
import { SharedVariations } from "@/components/publicaciones/shared-variations";
import { VariantPricingChildren } from "@/components/publicaciones/variant-pricing-children";
import { getPublicationDetail } from "@/lib/api/publication-detail";
import { getPublicationActivity } from "@/lib/api/publication-activity";
import { getPublicationCapabilities } from "@/lib/api/publication-capabilities";
import { getPublicationPrices } from "@/lib/api/publication-prices";
import { getPublicationPromotions } from "@/lib/api/publication-promotions";
import type { PublicationDetail } from "@/types/publication";

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

  const [prices, promotions, activity, capabilities] = await Promise.all([
    getPublicationPrices(id),
    getPublicationPromotions(id),
    getPublicationActivity(id),
    getPublicationCapabilities(id),
  ]);
  const childCapabilities =
    publication.model === "VARIANT_PRICING"
      ? await getChildCapabilities(id, publication.children)
      : {};

  return (
    <section className="publication-detail-page w-full min-w-0 space-y-6">
      <Link
        href="/dashboard/publicaciones"
        className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-dashboard-muted transition-colors hover:text-dashboard-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent"
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        Volver a publicaciones
      </Link>

      <PublicationDetailHeader
        publication={publication}
        capabilities={capabilities}
        prices={prices}
      />

      <PublicationCommercialSummary
        publication={publication}
        prices={prices}
        promotions={promotions}
        capabilities={capabilities}
      />

      <PublicationContent
        publication={publication}
        capabilities={capabilities}
      />

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
          <SharedVariations
            productId={publication.id}
            variations={publication.sharedVariations}
            stock={publication.stockTotal}
            sku={publication.sku}
          />
        ) : (
          <VariantPricingChildren
            productId={publication.id}
            items={publication.children}
            prices={prices?.targets ?? []}
            childCapabilities={childCapabilities}
          />
        )}
      </section>

      <PublicationActivity actions={activity} />
    </section>
  );
}

async function getChildCapabilities(
  productId: string,
  children: PublicationDetail["children"],
) {
  const entries: Array<
    readonly [
      string,
      Awaited<ReturnType<typeof getPublicationCapabilities>>,
    ]
  > = [];
  const itemIds = children.flatMap((child) =>
    child.itemId ? [child.itemId] : [],
  );

  for (let index = 0; index < itemIds.length; index += 6) {
    const batch = itemIds.slice(index, index + 6);
    const settled = await Promise.allSettled(
      batch.map((itemId) => getPublicationCapabilities(productId, itemId)),
    );
    settled.forEach((result, offset) => {
      if (result.status === "fulfilled") {
        entries.push([batch[offset], result.value] as const);
      }
    });
  }

  return Object.fromEntries(entries);
}
