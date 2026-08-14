"use client";

import { LoaderCircle, Tag, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  applyPriceDiscount,
  removePriceDiscount,
} from "@/app/dashboard/publicaciones/[id]/content-actions";
import { formatMoney } from "@/components/publicaciones/publication-display";
import type { PublicationPromotion } from "@/types/publication-commercial";

function isPriceDiscount(type: string) {
  return type.trim().toUpperCase().replaceAll("-", "_") === "PRICE_DISCOUNT";
}

export function PriceDiscountControls({
  productId,
  currencyId,
  promotions,
  canApply,
  canRemove,
}: Readonly<{
  productId: string;
  currencyId: string | null;
  promotions: readonly PublicationPromotion[];
  canApply: boolean;
  canRemove: boolean;
}>) {
  const priceDiscounts = promotions.filter((promotion) =>
    isPriceDiscount(promotion.type),
  );

  if (priceDiscounts.length === 0) {
    if (canApply) {
      return (
        <PriceDiscountRow
          productId={productId}
          currencyId={currencyId}
          promotion={EMPTY_PRICE_DISCOUNT}
          canApply
          canRemove={false}
        />
      );
    }

    return (
      <p className="text-sm text-dashboard-muted">
        No hay campañas PRICE_DISCOUNT disponibles para esta publicación.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {priceDiscounts.map((promotion) => (
        <PriceDiscountRow
          key={`${promotion.id}:${promotion.itemId ?? promotion.variationId ?? "product"}`}
          productId={productId}
          currencyId={currencyId}
          promotion={promotion}
          canApply={canApply || promotion.canApply}
          canRemove={canRemove || promotion.canRemove}
        />
      ))}
    </div>
  );
}

const EMPTY_PRICE_DISCOUNT: PublicationPromotion = {
  id: null,
  type: "PRICE_DISCOUNT",
  status: null,
  name: "Descuento individual",
  itemId: null,
  variationId: null,
  userProductId: null,
  regularPrice: null,
  promotionPrice: null,
  percentage: null,
  startDate: null,
  endDate: null,
  canApply: true,
  canRemove: false,
};

function PriceDiscountRow({
  productId,
  currencyId,
  promotion,
  canApply,
  canRemove,
}: Readonly<{
  productId: string;
  currencyId: string | null;
  promotion: PublicationPromotion;
  canApply: boolean;
  canRemove: boolean;
}>) {
  const router = useRouter();
  const [dealPrice, setDealPrice] = useState(
    promotion.promotionPrice === null ? "" : String(promotion.promotionPrice),
  );
  const [startDate, setStartDate] = useState(toLocalDateTime(promotion.startDate));
  const [finishDate, setFinishDate] = useState(toLocalDateTime(promotion.endDate));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const command = {
    productId,
    ...(promotion.itemId ? { itemId: promotion.itemId } : {}),
    ...(promotion.variationId ? { variationId: promotion.variationId } : {}),
    ...(promotion.userProductId
      ? { userProductId: promotion.userProductId }
      : {}),
  };

  function apply() {
    const value = Number(dealPrice);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Ingresá un precio promocional mayor a 0");
      return;
    }

    const start = new Date(startDate);
    const finish = new Date(finishDate);
    if (
      !startDate ||
      !finishDate ||
      Number.isNaN(start.getTime()) ||
      Number.isNaN(finish.getTime())
    ) {
      setError("Ingresá el inicio y el fin de la promoción");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await applyPriceDiscount({
        ...command,
        dealPrice: value,
        startDate: start.toISOString(),
        finishDate: finish.toISOString(),
      });
      if (!result.ok) {
        setError(result.error || `Error ${result.status}`);
        return;
      }
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm("¿Querés quitar esta promoción PRICE_DISCOUNT?")) return;

    setError(null);
    startTransition(async () => {
      const result = await removePriceDiscount(command);
      if (!result.ok) {
        setError(result.error || `Error ${result.status}`);
        return;
      }
      router.refresh();
    });
  }

  return (
    <article className="rounded-xl border border-dashboard-border bg-dashboard-control p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Tag aria-hidden="true" className="h-4 w-4 text-dashboard-accent-foreground" />
            <p className="font-semibold text-dashboard-foreground">
              {promotion.name || promotion.id || "Descuento individual"}
            </p>
            <span className="rounded-full border border-dashboard-border bg-card px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-dashboard-muted">
              {promotion.status || "sin estado"}
            </span>
          </div>
          <p className="mt-1 text-xs text-dashboard-muted">
            {promotion.itemId || promotion.userProductId || promotion.variationId || "Publicación"}
            {promotion.regularPrice !== null
              ? ` · Base ${formatMoney(promotion.regularPrice, currencyId)}`
              : ""}
          </p>
        </div>
        {canRemove ? (
          <button
            type="button"
            disabled={pending}
            onClick={remove}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-card px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            {pending ? (
              <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
            )}
            Quitar
          </button>
        ) : null}
      </div>

      {canApply ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
          <label className="min-w-0 flex-1 text-xs font-semibold text-dashboard-foreground">
            Precio promocional
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={dealPrice}
              disabled={pending}
              onChange={(event) => setDealPrice(event.target.value)}
              className="mt-1.5 h-9 w-full rounded-lg border border-dashboard-border bg-card px-3 text-sm"
            />
          </label>
          <label className="min-w-0 text-xs font-semibold text-dashboard-foreground">
            Inicio
            <input
              type="datetime-local"
              value={startDate}
              disabled={pending}
              onChange={(event) => setStartDate(event.target.value)}
              className="mt-1.5 h-9 w-full rounded-lg border border-dashboard-border bg-card px-3 text-sm"
            />
          </label>
          <label className="min-w-0 text-xs font-semibold text-dashboard-foreground">
            Fin (máximo 14 días)
            <input
              type="datetime-local"
              value={finishDate}
              disabled={pending}
              onChange={(event) => setFinishDate(event.target.value)}
              className="mt-1.5 h-9 w-full rounded-lg border border-dashboard-border bg-card px-3 text-sm"
            />
          </label>
          <button
            type="button"
            disabled={pending}
            onClick={apply}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-dashboard-accent px-3 text-xs font-semibold text-white disabled:opacity-60"
          >
            {pending ? (
              <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Tag aria-hidden="true" className="h-3.5 w-3.5" />
            )}
            Aplicar PRICE_DISCOUNT
          </button>
        </div>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-600" role="alert">{error}</p> : null}
    </article>
  );
}

function toLocalDateTime(value: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
