import { ArrowUpRight, ImageOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import {
  EMPTY_VALUE,
  formatInteger,
  formatMoney,
  formatPercentage,
  formatPrice,
  getStatusDisplay,
} from "@/components/publicaciones/publication-display";
import type { Publication } from "@/types/publication";

function Metric({
  label,
  children,
}: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-dashboard-muted sm:text-[0.67rem]">
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-sm font-semibold leading-snug text-dashboard-foreground">
        {children}
      </dd>
    </div>
  );
}

export function PublicationCard({
  publication,
}: Readonly<{ publication: Publication }>) {
  const status = getStatusDisplay(publication.status);
  const variantsLabel =
    publication.variantsCount === null
      ? EMPTY_VALUE
      : `${formatInteger(publication.variantsCount)} ${
          publication.variantsCount === 1 ? "variante" : "variantes"
        }`;
  const modelLabel =
    publication.model === "VARIANT_PRICING"
      ? "Publicación con variantes"
      : "Publicación simple";
  const regularPrice = formatPrice(publication.regularPrice);
  const title = publication.title || EMPTY_VALUE;

  return (
    <Link
      href={`/dashboard/publicaciones/${encodeURIComponent(publication.id)}`}
      prefetch={false}
      aria-label={`Ver publicación ${title}`}
      className="group block rounded-2xl border border-dashboard-border bg-card shadow-[0_14px_38px_-28px_var(--dashboard-shadow)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-dashboard-accent-border hover:shadow-[0_20px_46px_-26px_var(--dashboard-shadow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dashboard-background"
    >
      <article className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 gap-y-4 p-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-x-5 sm:p-5 lg:grid-cols-[9rem_minmax(0,1fr)]">
        <div className="relative aspect-square self-start overflow-hidden rounded-xl border border-dashboard-border bg-dashboard-control sm:row-span-2">
          {publication.thumbnail ? (
            <Image
              src={publication.thumbnail}
              alt={publication.title ? `Foto de ${publication.title}` : "Foto de la publicación"}
              fill
              sizes="(max-width: 640px) 88px, (max-width: 1024px) 128px, 144px"
              className="bg-white object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-dashboard-muted">
              <ImageOff aria-hidden="true" className="h-7 w-7" strokeWidth={1.5} />
              <span className="sr-only">Sin imagen</span>
            </div>
          )}
        </div>

        <div className="min-w-0 self-center sm:self-start">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <h2 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight text-dashboard-foreground sm:text-lg">
              {title}
            </h2>
            <ArrowUpRight
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0 text-dashboard-muted transition-[color,transform] duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-dashboard-accent"
              strokeWidth={1.8}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-dashboard-muted">
            <span className="rounded-full border border-dashboard-accent-border bg-dashboard-accent-soft px-2.5 py-1 font-semibold tracking-wide text-dashboard-accent-foreground">
              {modelLabel}
            </span>
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-dashboard-border" />
            <span>{variantsLabel}</span>
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-dashboard-border" />
            <span className={`rounded-full border px-2.5 py-1 font-semibold ${status.className}`}>
              {status.label}
            </span>
          </div>
        </div>

        <div className="col-span-2 min-w-0 border-t border-dashboard-border pt-4 sm:col-span-1 sm:col-start-2">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-3 md:gap-x-6">
            <Metric label="Stock">{formatInteger(publication.stockTotal)}</Metric>
            <Metric label="Precio actual">
              {formatPrice(publication.currentPrice)}
            </Metric>
            <Metric label="Precio tachado">
              {regularPrice === EMPTY_VALUE ? (
                EMPTY_VALUE
              ) : (
                <s className="font-medium text-dashboard-muted decoration-dashboard-muted/70">
                  {regularPrice}
                </s>
              )}
            </Metric>
          </dl>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-dashboard-border pt-4 md:grid-cols-4 md:gap-x-6">
            <Metric label="Promo">
              {formatPercentage(publication.promotionPercentage)}
            </Metric>
            <Metric label="Ganancia est.">
              {formatMoney(publication.estimatedProfit, publication.currencyId)}
            </Metric>
            <Metric label="Visitas">{formatInteger(publication.visits)}</Metric>
            <Metric label="Flex">
              {publication.hasFlex === null
                ? EMPTY_VALUE
                : publication.hasFlex
                  ? "Sí"
                  : "No"}
            </Metric>
          </dl>
        </div>
      </article>
    </Link>
  );
}
