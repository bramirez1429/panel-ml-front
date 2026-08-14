import { PriceDiscountControls } from "@/components/publicaciones/price-discount-controls";
import {
  EMPTY_VALUE,
  formatMoney,
  formatPercentage,
} from "@/components/publicaciones/publication-display";
import type { PublicationDetail } from "@/types/publication";
import type { PublicationCapabilities } from "@/types/publication-capabilities";
import type {
  PublicationPrices,
  PublicationPromotion,
} from "@/types/publication-commercial";

function date(value: string | null) {
  if (!value) return EMPTY_VALUE;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(parsed);
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-xl border border-dashboard-border bg-dashboard-control px-3 py-3">
      <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-dashboard-muted">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-semibold text-dashboard-foreground">{value}</dd>
    </div>
  );
}

export function PublicationCommercialSummary({
  publication,
  prices,
  promotions,
  capabilities,
}: Readonly<{
  publication: PublicationDetail;
  prices: PublicationPrices | null;
  promotions: readonly PublicationPromotion[];
  capabilities: PublicationCapabilities | null;
}>) {
  const summary = prices?.summary;
  const currencyId = summary?.currencyId ?? publication.currencyId;
  const currentPromotion = promotions.find((promotion) =>
    ["STARTED", "ACTIVE", "started", "active"].includes(promotion.status ?? ""),
  );
  const standardPrice = summary?.standardPrice ?? null;
  const salePrice = summary?.salePrice ?? publication.currentPrice?.from ?? null;
  const regularPrice = summary?.regularPrice ?? publication.regularPrice?.from ?? null;
  const promotionPrice =
    summary?.promotionPrice ?? currentPromotion?.promotionPrice ?? null;
  const percentage =
    summary?.promotionPercentage ??
    currentPromotion?.percentage ??
    publication.promotionPercentage;

  return (
    <section className="rounded-2xl border border-dashboard-border bg-card p-5 sm:p-6" aria-labelledby="commercial-heading">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dashboard-accent-foreground">
          Precios y promociones
        </p>
        <h2 id="commercial-heading" className="mt-2 text-xl font-semibold tracking-tight text-dashboard-foreground">
          Estado comercial
        </h2>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Precio estándar" value={formatMoney(standardPrice, currencyId)} />
        <Metric label="Precio actual" value={formatMoney(salePrice, currencyId)} />
        <Metric label="Precio tachado" value={formatMoney(regularPrice, currencyId)} />
        <Metric label="Precio promoción" value={formatMoney(promotionPrice, currencyId)} />
        <Metric label="Descuento" value={formatPercentage(percentage)} />
        <Metric label="Promoción" value={summary?.promotionId ?? currentPromotion?.id ?? EMPTY_VALUE} />
        <Metric label="Inicio" value={date(summary?.promotionStartDate ?? currentPromotion?.startDate ?? null)} />
        <Metric label="Fin" value={date(summary?.promotionEndDate ?? currentPromotion?.endDate ?? null)} />
        <Metric
          label="Flex"
          value={publication.hasFlex === null ? EMPTY_VALUE : publication.hasFlex ? "Sí" : "No"}
        />
      </dl>

      <div className="mt-5 border-t border-dashboard-border pt-5">
        <h3 className="text-sm font-semibold text-dashboard-foreground">PRICE_DISCOUNT</h3>
        <p className="mt-1 text-xs text-dashboard-muted">
          Solo se muestran las acciones que el backend marcó como administrables.
        </p>
        <div className="mt-3">
          <PriceDiscountControls
            productId={publication.id}
            currencyId={currencyId}
            promotions={promotions}
            canApply={capabilities?.priceDiscountApply ?? false}
            canRemove={capabilities?.priceDiscountRemove ?? false}
          />
        </div>
      </div>
    </section>
  );
}

