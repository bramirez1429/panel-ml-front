import { ExternalLink, ImageOff, PackageOpen } from "lucide-react";
import Image from "next/image";

import {
  EMPTY_VALUE,
  formatInteger,
  formatMoney,
  getStatusDisplay,
} from "@/components/publicaciones/publication-display";
import { EditSku } from "@/components/publicaciones/edit-sku";
import { InlinePublicationEditor } from "@/components/publicaciones/inline-publication-editor";
import { PictureManager } from "@/components/publicaciones/picture-manager";
import { PublicationChildContent } from "@/components/publicaciones/publication-child-content";
import { PublicationStatusButton } from "@/components/publicaciones/publication-status-button";
import {
  comparePublicationSizes,
  comparePublicationText,
} from "@/lib/publications/size-order";
import type { VariantPricingChildDetail } from "@/types/publication";
import type { PublicationPriceSummary } from "@/types/publication-commercial";
import type { PublicationCapabilities } from "@/types/publication-capabilities";

function displayText(value: string | null) {
  return value || EMPTY_VALUE;
}

function priceForChild(
  child: VariantPricingChildDetail,
  prices: readonly PublicationPriceSummary[],
) {
  const official = prices.find(
    (price) =>
      (child.itemId && price.itemId === child.itemId) ||
      (child.userProductId && price.userProductId === child.userProductId),
  );

  return {
    value:
      official?.standardPrice ??
      official?.salePrice ??
      official?.promotionPrice ??
      child.price,
    currencyId: official?.currencyId ?? child.currencyId,
  };
}

function VariantImage({ child }: { child: VariantPricingChildDetail }) {
  return (
    <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-xl border border-dashboard-border bg-dashboard-control">
      {child.thumbnail ? (
        <Image
          src={child.thumbnail}
          alt={child.title ? `Foto de ${child.title}` : "Foto de la variante"}
          fill
          sizes="72px"
          className="bg-white object-contain p-1.5"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-dashboard-muted">
          <ImageOff aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
          <span className="sr-only">Sin imagen</span>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const display = getStatusDisplay(status);

  return (
    <span
      className={`inline-flex max-w-full truncate rounded-full border px-2 py-0.5 text-[0.68rem] font-semibold ${display.className}`}
      title={display.label}
    >
      {display.label}
    </span>
  );
}

function MlaLink({ child }: { child: VariantPricingChildDetail }) {
  const label = displayText(child.itemId);

  if (!child.permalink || !child.itemId) {
    return (
      <span
        className="block truncate font-mono text-dashboard-muted"
        title={label}
      >
        {label}
      </span>
    );
  }

  return (
    <a
      href={child.permalink}
      target="_blank"
      rel="noopener noreferrer"
      title={`${child.itemId} · abrir publicación`}
      className="inline-flex max-w-full items-center gap-1 font-mono font-semibold text-dashboard-accent-foreground underline-offset-4 transition-colors hover:text-dashboard-accent hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent"
    >
      <span className="truncate">{child.itemId}</span>
      <ExternalLink aria-hidden="true" className="h-3 w-3 shrink-0" />
      <span className="sr-only"> (abre en una pestaña nueva)</span>
    </a>
  );
}

function MobileMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-dashboard-muted">
        {label}
      </dt>
      <dd
        className="mt-1 truncate text-sm font-semibold text-dashboard-foreground"
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}

function MobileVariantCard({
  child,
  productId,
  prices,
  capabilities,
}: {
  child: VariantPricingChildDetail;
  productId: string;
  prices: readonly PublicationPriceSummary[];
  capabilities: PublicationCapabilities | null;
}) {
  const referenceSize = displayText(child.filterableSize);
  const size = displayText(child.size);
  const officialPrice = priceForChild(child, prices);

  return (
    <div className="rounded-2xl border border-dashboard-border bg-card p-4 shadow-[0_14px_36px_-30px_var(--dashboard-shadow)]">
      <div className="flex gap-4">
        <VariantImage child={child} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-3">
              <div className="min-w-0">
                <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-dashboard-muted">
                  Referencia size
                </p>
                <p
                  className="mt-1 truncate text-base font-semibold text-dashboard-foreground"
                  title={referenceSize}
                >
                  {referenceSize}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-dashboard-muted">
                  Size
                </p>
                <p
                  className="mt-1 truncate text-base font-semibold text-dashboard-foreground"
                  title={size}
                >
                  {size}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <StatusBadge status={child.status} />
              {child.itemId ? (
                <PublicationStatusButton
                  key={child.status}
                  productId={productId}
                  itemId={child.itemId}
                  status={child.status}
                />
              ) : null}
            </div>
          </div>

          <div className="mt-2 min-w-0">
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-dashboard-muted">
              Color
            </p>
            <p
              className="mt-1 truncate text-sm font-medium text-dashboard-foreground"
              title={child.color ?? undefined}
            >
              {displayText(child.color)}
            </p>
          </div>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-dashboard-border pt-4">
        <div className="min-w-0">
          <dt className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-dashboard-muted">
            Stock
          </dt>
          <dd className="mt-1 text-sm text-dashboard-foreground">
            {child.itemId ? (
              <InlinePublicationEditor
                model="VARIANT_PRICING"
                field="stock"
                productId={productId}
                itemId={child.itemId}
                value={child.availableQuantity}
                label={`stock de ${child.itemId}`}
              />
            ) : (
              formatInteger(child.availableQuantity)
            )}
          </dd>
        </div>
        <MobileMetric
          label="Vendidos"
          value={formatInteger(child.soldQuantity)}
        />
        <div className="min-w-0">
          <dt className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-dashboard-muted">
            Precio
          </dt>
          <dd className="mt-1 text-sm text-dashboard-foreground">
            {child.itemId ? (
              <InlinePublicationEditor
                model="VARIANT_PRICING"
                field="price"
                productId={productId}
                itemId={child.itemId}
                value={officialPrice.value}
                currencyId={officialPrice.currencyId}
                label={`precio de ${child.itemId}`}
              />
            ) : (
              formatMoney(officialPrice.value, officialPrice.currencyId)
            )}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-dashboard-muted">
            SKU
          </dt>
          <dd className="mt-1 text-sm text-dashboard-foreground">
            {child.itemId ? (
              <EditSku
                key={child.sku}
                model="VARIANT_PRICING"
                productId={productId}
                itemId={child.itemId}
                value={child.sku}
                label={`SKU de ${child.itemId}`}
              />
            ) : (
              displayText(child.sku)
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex min-w-0 flex-col gap-3 border-t border-dashboard-border pt-4 text-xs sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-dashboard-muted">
            MLA
          </p>
          <MlaLink child={child} />
        </div>
        {child.itemId ? (
          <PictureManager
            key={child.pictures
              .map(({ id, url }) => `${id}:${url}`)
              .join("|")}
            productId={productId}
            itemId={child.itemId}
            pictures={child.pictures}
            title={child.title || child.itemId}
            compact
          />
        ) : null}
      </div>
      {child.itemId ? (
        <div className="mt-3">
          <PublicationChildContent
            productId={productId}
            itemId={child.itemId}
            capabilities={capabilities}
          />
        </div>
      ) : null}
    </div>
  );
}

const headerClassName =
  "px-2.5 py-2.5 text-left text-[0.58rem] font-semibold uppercase leading-tight tracking-[0.1em] text-dashboard-muted";
const cellClassName =
  "min-w-0 border-t border-dashboard-border px-2.5 py-2.5 align-middle text-xs text-dashboard-foreground";

export function VariantPricingChildren({
  items,
  productId,
  prices,
  childCapabilities,
}: Readonly<{
  items: readonly VariantPricingChildDetail[];
  productId: string;
  prices: readonly PublicationPriceSummary[];
  childCapabilities: Readonly<Record<string, PublicationCapabilities | null>>;
}>) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-dashboard-border bg-card px-6 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-dashboard-control text-dashboard-muted">
          <PackageOpen aria-hidden="true" className="h-5 w-5" strokeWidth={1.6} />
        </div>
        <p className="mt-3 text-sm font-semibold text-dashboard-foreground">
          No hay variantes disponibles
        </p>
        <p className="mt-1 max-w-sm text-sm text-dashboard-muted">
          Esta publicación todavía no tiene hijos guardados.
        </p>
      </div>
    );
  }

  const sortedItems = [...items].sort(
    (left, right) =>
      comparePublicationSizes(left.size, right.size) ||
      comparePublicationText(left.color, right.color) ||
      comparePublicationText(left.itemId ?? left.id, right.itemId ?? right.id),
  );

  return (
    <>
      <div className="space-y-3 lg:hidden">
        {sortedItems.map((child) => (
          <MobileVariantCard
            key={child.id}
            child={child}
            productId={productId}
            prices={prices}
            capabilities={
              child.itemId ? childCapabilities[child.itemId] ?? null : null
            }
          />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-dashboard-border bg-card shadow-[0_16px_42px_-34px_var(--dashboard-shadow)] lg:block">
        <div className="p-2.5">
          <table className="w-full table-fixed border-collapse overflow-hidden rounded-xl">
            <caption className="sr-only">
              Variantes ordenadas por size y color
            </caption>
            <colgroup>
              <col className="w-[6%]" />
              <col className="w-[9%]" />
              <col className="w-[8%]" />
              <col className="w-[11%]" />
              <col className="w-[6%]" />
              <col className="w-[14%]" />
              <col className="w-[16%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
            </colgroup>
            <thead className="bg-dashboard-control">
              <tr>
                <th scope="col" className={headerClassName}>Size</th>
                <th scope="col" className={headerClassName}>Referencia size</th>
                <th scope="col" className={headerClassName}>Color</th>
                <th scope="col" className={headerClassName}>Stock</th>
                <th scope="col" className={headerClassName}>Vendidos</th>
                <th scope="col" className={headerClassName}>Precio</th>
                <th scope="col" className={headerClassName}>SKU</th>
                <th scope="col" className={headerClassName}>Estado</th>
                <th scope="col" className={headerClassName}>MLA</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((child) => {
                const referenceSize = displayText(child.filterableSize);
                const size = displayText(child.size);
                const color = displayText(child.color);
                const sku = displayText(child.sku);
                const stock = formatInteger(child.availableQuantity);
                const sold = formatInteger(child.soldQuantity);
                const officialPrice = priceForChild(child, prices);
                const price = formatMoney(
                  officialPrice.value,
                  officialPrice.currencyId,
                );

                return (
                  <tr
                    key={child.id}
                    className="transition-colors hover:bg-dashboard-control"
                  >
                    <td className={`${cellClassName} font-semibold`}>
                      <span className="block truncate"  title={size}>
                        {size}
                      </span>
                    </td>
                    <td className={`${cellClassName} font-semibold`} title={referenceSize}>
                      <span className="block truncate">
                        {referenceSize}
                       
                      </span>
                    </td>
                    <td className={cellClassName}>
                      <span className="block truncate" title={color}>
                        {color}
                      </span>
                    </td>
                    <td className={`${cellClassName} whitespace-nowrap font-semibold tabular-nums`}>
                      {child.itemId ? (
                        <InlinePublicationEditor
                          model="VARIANT_PRICING"
                          field="stock"
                          productId={productId}
                          itemId={child.itemId}
                          value={child.availableQuantity}
                          label={`stock de ${child.itemId}`}
                        />
                      ) : (
                        <span className="block truncate" title={stock}>
                          {stock}
                        </span>
                      )}
                    </td>
                    <td className={`${cellClassName} whitespace-nowrap tabular-nums`}>
                      <span className="block truncate" title={sold}>
                        {sold}
                      </span>
                    </td>
                    <td className={`${cellClassName} whitespace-nowrap font-semibold tabular-nums`}>
                      {child.itemId ? (
                        <InlinePublicationEditor
                          model="VARIANT_PRICING"
                          field="price"
                          productId={productId}
                          itemId={child.itemId}
                          value={officialPrice.value}
                          currencyId={officialPrice.currencyId}
                          label={`precio de ${child.itemId}`}
                        />
                      ) : (
                        <span className="block truncate" title={price}>
                          {price}
                        </span>
                      )}
                    </td>
                    <td className={`${cellClassName} font-mono text-[0.7rem]`}>
                      {child.itemId ? (
                        <EditSku
                          key={child.sku}
                          model="VARIANT_PRICING"
                          productId={productId}
                          itemId={child.itemId}
                          value={child.sku}
                          label={`SKU de ${child.itemId}`}
                        />
                      ) : (
                        <span className="block truncate" title={sku}>
                          {sku}
                        </span>
                      )}
                    </td>
                    <td className={cellClassName}>
                      <div className="flex flex-col items-start gap-1.5">
                        <StatusBadge status={child.status} />
                        {child.itemId ? (
                          <PublicationStatusButton
                            key={child.status}
                            productId={productId}
                            itemId={child.itemId}
                            status={child.status}
                          />
                        ) : null}
                      </div>
                    </td>
                    <td className={`${cellClassName} min-w-0`}>
                      <div className="flex min-w-0 flex-col items-start gap-2">
                        <MlaLink child={child} />
                        {child.itemId ? (
                          <PictureManager
                            key={child.pictures
                              .map(({ id, url }) => `${id}:${url}`)
                              .join("|")}
                            productId={productId}
                            itemId={child.itemId}
                            pictures={child.pictures}
                            title={child.title || child.itemId}
                            compact
                          />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="hidden space-y-3 lg:block">
        {sortedItems.flatMap((child) =>
          child.itemId
            ? [
                <PublicationChildContent
                  key={child.itemId}
                  productId={productId}
                  itemId={child.itemId}
                  capabilities={childCapabilities[child.itemId] ?? null}
                />,
              ]
            : [],
        )}
      </div>
    </>
  );
}
