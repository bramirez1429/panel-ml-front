import { ExternalLink, ImageOff } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import {
  EMPTY_VALUE,
  formatInteger,
  formatPrice,
  getStatusDisplay,
} from "@/components/publicaciones/publication-display";
import { EditPublicationText } from "@/components/publicaciones/edit-publication-text";
import { InlinePublicationEditor } from "@/components/publicaciones/inline-publication-editor";
import { PictureManager } from "@/components/publicaciones/picture-manager";
import { PublicationStatusButton } from "@/components/publicaciones/publication-status-button";
import type { PublicationDetail } from "@/types/publication";
import type { PublicationCapabilities } from "@/types/publication-capabilities";
import type { PublicationPrices } from "@/types/publication-commercial";

function DetailMetric({
  label,
  children,
}: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <div className="min-w-0 rounded-xl border border-dashboard-border bg-dashboard-control px-4 py-3.5">
      <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-dashboard-muted">
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-sm font-semibold leading-relaxed text-dashboard-foreground">
        {children}
      </dd>
    </div>
  );
}

export function PublicationDetailHeader({
  publication,
  capabilities,
  prices,
}: Readonly<{
  publication: PublicationDetail;
  capabilities: PublicationCapabilities | null;
  prices: PublicationPrices | null;
}>) {
  const status = getStatusDisplay(publication.status);
  const modelLabel =
    publication.model === "VARIANT_PRICING"
      ? "VARIANT_PRICING · Publicación con variantes"
      : "SHARED · Publicación simple";
  const title = publication.title || EMPTY_VALUE;
  const sizes = publication.sizes?.join(" · ") || EMPTY_VALUE;
  const relationship = publication.familyId
    ? { label: "Family ID", value: publication.familyId }
    : {
        label: "Parent item ID",
        value: publication.parentItemId || EMPTY_VALUE,
      };
  const authoritativePrice =
    prices?.summary.standardPrice ??
    prices?.summary.salePrice ??
    publication.currentPrice?.from ??
    null;
  const authoritativeCurrency =
    prices?.summary.currencyId ?? publication.currencyId;

  return (
    <header className="overflow-hidden rounded-3xl border border-dashboard-border bg-card shadow-[0_20px_55px_-36px_var(--dashboard-shadow)]">
      <div className="grid gap-5 p-5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6 sm:p-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:p-7">
        <div className="space-y-3 self-start">
        {publication.thumbnail ? (
          <Image
            src={publication.thumbnail}
            alt={publication.title ? `Foto de ${publication.title}` : "Foto de la publicación"}
            width={320}
            height={320}
            sizes="(max-width: 640px) calc(100vw - 72px), (max-width: 1024px) 176px, 224px"
            className="aspect-square h-auto w-full rounded-xl object-contain"
          />
        ) : (
          <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 text-dashboard-muted">
            <ImageOff aria-hidden="true" className="h-8 w-8" strokeWidth={1.4} />
            <span className="text-xs font-medium">Sin imagen</span>
          </div>
        )}
          {publication.model === "SHARED" ? (
            <PictureManager
              key={publication.pictures
                .map(({ id, url }) => `${id}:${url}`)
                .join("|")}
              productId={publication.id}
              pictures={publication.pictures}
              title={title}
            />
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-dashboard-accent-border bg-dashboard-accent-soft px-2.5 py-1 text-xs font-semibold text-dashboard-accent-foreground">
                  {modelLabel}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}
                >
                  {status.label}
                </span>
                {publication.model === "SHARED" ? (
                  <PublicationStatusButton
                    key={publication.status}
                    productId={publication.id}
                    status={publication.status}
                  />
                ) : null}
              </div>

              <div className="mt-4 text-dashboard-foreground">
                <EditPublicationText
                  productId={publication.id}
                  field="title"
                  value={publication.title}
                  editable={capabilities?.title.editable ?? false}
                  reason={capabilities?.title.reason}
                  prominent
                />
              </div>
            </div>

            {publication.permalink ? (
              <a
                href={publication.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-dashboard-border bg-card px-3.5 text-sm font-semibold text-dashboard-foreground transition-colors hover:border-dashboard-accent-border hover:bg-dashboard-control hover:text-dashboard-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent"
              >
                Ver publicación
                <span className="sr-only"> (abre en una pestaña nueva)</span>
                <ExternalLink aria-hidden="true" className="h-4 w-4" />
              </a>
            ) : null}
          </div>

          <div className="mt-6 border-t border-dashboard-border pt-5">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-dashboard-muted">
              Precio actual
            </p>
            <div className="mt-1.5 text-dashboard-foreground">
              {publication.model === "SHARED" ? (
                <InlinePublicationEditor
                  model="SHARED"
                  field="price"
                  productId={publication.id}
                  value={authoritativePrice}
                  currencyId={authoritativeCurrency}
                  label="precio de la publicación"
                  prominent
                />
              ) : (
                <p className="text-2xl font-semibold tracking-tight">
                  {formatPrice(publication.currentPrice)}
                </p>
              )}
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <DetailMetric label="Stock total">
              {formatInteger(publication.stockTotal)}
            </DetailMetric>
            <DetailMetric label="Variantes">
              {formatInteger(publication.variantsCount)}
            </DetailMetric>
            <DetailMetric label={relationship.label}>
              <span className="break-all">{relationship.value}</span>
            </DetailMetric>
            <DetailMetric label="Talles">{sizes}</DetailMetric>
          </dl>
        </div>
      </div>
    </header>
  );
}
