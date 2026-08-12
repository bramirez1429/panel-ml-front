import { ExternalLink, ImageOff, PackageOpen } from "lucide-react";
import Image from "next/image";

import {
  EMPTY_VALUE,
  formatInteger,
  formatMoney,
  getStatusDisplay,
} from "@/components/publicaciones/publication-display";
import {
  comparePublicationSizes,
  comparePublicationText,
} from "@/lib/publications/size-order";
import type { VariantPricingChildDetail } from "@/types/publication";

function displayText(value: string | null) {
  return value || EMPTY_VALUE;
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

function MobileVariantCard({ child }: { child: VariantPricingChildDetail }) {
  const referenceSize = displayText(child.filterableSize);
  const size = displayText(child.size);

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
            <StatusBadge status={child.status} />
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
        <MobileMetric
          label="Stock"
          value={formatInteger(child.availableQuantity)}
        />
        <MobileMetric
          label="Vendidos"
          value={formatInteger(child.soldQuantity)}
        />
        <MobileMetric
          label="Precio"
          value={formatMoney(child.price, child.currencyId)}
        />
        <MobileMetric label="SKU" value={displayText(child.sku)} />
      </dl>

      <div className="mt-4 min-w-0 border-t border-dashboard-border pt-4 text-xs">
        <p className="mb-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-dashboard-muted">
          MLA
        </p>
        <MlaLink child={child} />
      </div>
    </div>
  );
}

const headerClassName =
  "px-2.5 py-2.5 text-left text-[0.58rem] font-semibold uppercase leading-tight tracking-[0.1em] text-dashboard-muted";
const cellClassName =
  "min-w-0 border-t border-dashboard-border px-2.5 py-2.5 align-middle text-xs text-dashboard-foreground";

export function VariantPricingChildren({
  items,
}: Readonly<{
  items: readonly VariantPricingChildDetail[];
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
          <MobileVariantCard key={child.id} child={child} />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-dashboard-border bg-card shadow-[0_16px_42px_-34px_var(--dashboard-shadow)] lg:block">
        <div className="p-2.5">
          <table className="w-full table-fixed border-collapse overflow-hidden rounded-xl">
            <caption className="sr-only">
              Variantes ordenadas por size y color
            </caption>
            <colgroup>
              <col className="w-[4%]" />
              <col className="w-[10%]" />
              <col className="w-[7%]" />
              <col className="w-[4%]" />
              <col className="w-[7%]" />
              <col className="w-[10%]" />
              <col className="w-[14%]" />
              <col className="w-[11%]" />
              <col className="w-[10%]" />
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
                const price = formatMoney(child.price, child.currencyId);

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
                      <span className="block truncate" title={stock}>
                        {stock}
                      </span>
                    </td>
                    <td className={`${cellClassName} whitespace-nowrap tabular-nums`}>
                      <span className="block truncate" title={sold}>
                        {sold}
                      </span>
                    </td>
                    <td className={`${cellClassName} whitespace-nowrap font-semibold tabular-nums`}>
                      <span className="block truncate" title={price}>
                        {price}
                      </span>
                    </td>
                    <td className={`${cellClassName} font-mono text-[0.7rem]`}>
                      <span className="block truncate" title={sku}>
                        {sku}
                      </span>
                    </td>
                    <td className={cellClassName}>
                      <StatusBadge status={child.status} />
                    </td>
                    <td className={`${cellClassName} min-w-0`}>
                      <MlaLink child={child} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
