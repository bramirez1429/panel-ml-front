import { ExternalLink, ImageOff } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import {
  EMPTY_VALUE,
  formatInteger,
  formatPrice,
  getStatusDisplay,
} from "@/components/publicaciones/publication-display";
import type { PublicationDetail } from "@/types/publication";

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
}: Readonly<{ publication: PublicationDetail }>) {
  const status = getStatusDisplay(publication.status);
  const modelLabel =
    publication.model === "VARIANT_PRICING" ? "Nueva" : "Vieja";
  const title = publication.title || EMPTY_VALUE;
  const sizes = publication.sizes?.join(" · ") || EMPTY_VALUE;
  const relationship = publication.familyId
    ? { label: "Family ID", value: publication.familyId }
    : {
        label: "Parent item ID",
        value: publication.parentItemId || EMPTY_VALUE,
      };

  return (
    <header className="overflow-hidden rounded-3xl border border-dashboard-border bg-card shadow-[0_20px_55px_-36px_var(--dashboard-shadow)]">
      <div className="grid gap-5 p-5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6 sm:p-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:p-7">
        {publication.thumbnail ? (
          <Image
            src={publication.thumbnail}
            alt={publication.title ? `Foto de ${publication.title}` : "Foto de la publicación"}
            width={320}
            height={320}
            sizes="(max-width: 640px) calc(100vw - 72px), (max-width: 1024px) 176px, 224px"
            className="aspect-square h-auto w-full self-start rounded-xl object-contain"
          />
        ) : (
          <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 self-start text-dashboard-muted">
            <ImageOff aria-hidden="true" className="h-8 w-8" strokeWidth={1.4} />
            <span className="text-xs font-medium">Sin imagen</span>
          </div>
        )}

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
              </div>

              <h1 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-dashboard-foreground sm:text-3xl">
                {title}
              </h1>
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
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-dashboard-foreground">
              {formatPrice(publication.currentPrice)}
            </p>
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
