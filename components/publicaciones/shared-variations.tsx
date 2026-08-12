import {
  EMPTY_VALUE,
  formatInteger,
} from "@/components/publicaciones/publication-display";
import {
  comparePublicationSizes,
  comparePublicationText,
} from "@/lib/publications/size-order";
import type { SharedVariationDetail } from "@/types/publication";

function VariationMetric({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-dashboard-muted">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold text-dashboard-foreground" title={value}>
        {value}
      </dd>
    </div>
  );
}

export function SharedVariations({
  variations,
}: Readonly<{ variations: readonly SharedVariationDetail[] }>) {
  if (variations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-dashboard-border bg-card px-6 py-10 text-center">
        <p className="text-sm font-semibold text-dashboard-foreground">
          No hay variaciones disponibles
        </p>
        <p className="mt-1 text-sm text-dashboard-muted">
          Esta publicación no tiene variaciones compartidas registradas.
        </p>
      </div>
    );
  }

  const sortedVariations = [...variations].sort(
    (left, right) =>
      comparePublicationSizes(left.size, right.size) ||
      comparePublicationText(left.color, right.color) ||
      comparePublicationText(left.id, right.id),
  );

  return (
    <>
      <div className="space-y-3 lg:hidden">
        {sortedVariations.map((variation) => (
          <div
            key={variation.id}
            className="rounded-2xl border border-dashboard-border bg-card p-4 shadow-[0_12px_30px_-26px_var(--dashboard-shadow)]"
          >
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              <VariationMetric
                label="Talle"
                value={variation.size || EMPTY_VALUE}
              />
              <VariationMetric
                label="Color"
                value={variation.color || EMPTY_VALUE}
              />
              <VariationMetric
                label="Stock"
                value={formatInteger(variation.availableQuantity)}
              />
              <VariationMetric
                label="Vendidos"
                value={formatInteger(variation.soldQuantity)}
              />
            </dl>

            <div className="mt-4 border-t border-dashboard-border pt-3">
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-dashboard-muted">
                ID de variación
              </p>
              <p className="mt-1 truncate font-mono text-xs font-medium text-dashboard-foreground" title={variation.id}>
                {variation.id || EMPTY_VALUE}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-dashboard-border bg-card lg:block">
        <table className="w-full table-fixed border-collapse text-left">
          <caption className="sr-only">
            Variaciones compartidas ordenadas por talle y color
          </caption>
          <colgroup>
            <col className="w-[14%]" />
            <col className="w-[24%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[38%]" />
          </colgroup>
          <thead className="bg-dashboard-control">
            <tr className="border-b border-dashboard-border">
              {[
                "Talle",
                "Color",
                "Stock",
                "Vendidos",
                "ID de variación",
              ].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="whitespace-nowrap px-3 py-2.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-dashboard-muted"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dashboard-border">
            {sortedVariations.map((variation) => {
              const size = variation.size || EMPTY_VALUE;
              const color = variation.color || EMPTY_VALUE;
              const variationId = variation.id || EMPTY_VALUE;

              return (
                <tr
                  key={variation.id}
                  className="transition-colors hover:bg-dashboard-control"
                >
                  <td className="px-3 py-3 text-xs font-semibold text-dashboard-foreground">
                    <span className="block truncate" title={size}>{size}</span>
                  </td>
                  <td className="px-3 py-3 text-xs text-dashboard-foreground">
                    <span className="block truncate" title={color}>{color}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs font-semibold tabular-nums text-dashboard-foreground">
                    {formatInteger(variation.availableQuantity)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs tabular-nums text-dashboard-foreground">
                    {formatInteger(variation.soldQuantity)}
                  </td>
                  <td className="px-3 py-3 font-mono text-[0.7rem] text-dashboard-foreground">
                    <span className="block truncate" title={variationId}>
                      {variationId}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
