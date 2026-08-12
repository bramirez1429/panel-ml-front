import type { PublicationPrice } from "@/types/publication";

export const EMPTY_VALUE = "—";

export function formatInteger(value: number | null) {
  return value === null
    ? EMPTY_VALUE
    : new Intl.NumberFormat("es-AR").format(value);
}

export function formatMoney(
  value: number | null,
  currencyId: string | null,
) {
  if (value === null || !currencyId) {
    return EMPTY_VALUE;
  }

  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currencyId,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return EMPTY_VALUE;
  }
}

export function formatPrice(price: PublicationPrice | null) {
  if (!price) {
    return EMPTY_VALUE;
  }

  const from = formatMoney(price.from, price.currencyId);
  const to = formatMoney(price.to, price.currencyId);

  return price.to === null || price.from === price.to
    ? from
    : `${from} – ${to}`;
}

export function formatPercentage(value: number | null) {
  if (value === null) {
    return EMPTY_VALUE;
  }

  return `${new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

export function getStatusDisplay(status: string | null) {
  if (!status) {
    return {
      label: EMPTY_VALUE,
      className:
        "border-dashboard-border bg-dashboard-control text-dashboard-muted",
    };
  }

  const normalized = status.toLowerCase();

  if (normalized === "active") {
    return {
      label: "Activa",
      className:
        "border-dashboard-success-border bg-dashboard-success-soft text-dashboard-success-foreground",
    };
  }

  if (normalized === "paused") {
    return {
      label: "Pausada",
      className:
        "border-dashboard-accent-border bg-dashboard-warning-soft text-dashboard-warning",
    };
  }

  if (normalized === "closed") {
    return {
      label: "Finalizada",
      className:
        "border-dashboard-border bg-dashboard-control text-dashboard-muted",
    };
  }

  return {
    label: status.replaceAll("_", " "),
    className:
      "border-dashboard-border bg-dashboard-control text-dashboard-muted",
  };
}
