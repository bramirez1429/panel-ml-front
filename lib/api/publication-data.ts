import "server-only";

import type {
  PublicationAttribute,
  PublicationPrice,
} from "@/types/publication";
import { comparePublicationSizes } from "@/lib/publications/size-order";

export function asFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function textOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function createPrice(
  fromValue: unknown,
  toValue: unknown,
  currencyId: string | null,
): PublicationPrice | null {
  const from = asFiniteNumber(fromValue);

  if (from === null || !currencyId) {
    return null;
  }

  return {
    from,
    to: asFiniteNumber(toValue),
    currencyId,
  };
}

export function normalizeThumbnail(value: unknown) {
  const thumbnail = textOrNull(value);

  if (!thumbnail) {
    return null;
  }

  try {
    const url = new URL(thumbnail);

    if (
      url.hostname !== "http2.mlstatic.com" ||
      url.port !== "" ||
      url.search !== ""
    ) {
      return null;
    }

    url.protocol = "https:";
    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeAttributes(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const attributes = new Map<string, PublicationAttribute>();

  for (const rawAttribute of value) {
    if (!isObject(rawAttribute)) {
      continue;
    }

    const id = textOrNull(rawAttribute.id);

    if (!id || attributes.has(id)) {
      continue;
    }

    attributes.set(id, {
      id,
      value:
        textOrNull(rawAttribute.valueName) ??
        textOrNull(rawAttribute.value_name) ??
        textOrNull(rawAttribute.value),
    });
  }

  return [...attributes.values()];
}

export function attributeValue(
  attributes: readonly PublicationAttribute[],
  ids: readonly string[],
) {
  for (const id of ids) {
    const value = attributes.find(
      (attribute) => attribute.id.toUpperCase() === id,
    )?.value;

    if (value) {
      return value;
    }
  }

  return null;
}

export function preferredSize(value: unknown) {
  const attributes = normalizeAttributes(value);
  const numericSize = attributes.find(
    ({ id, value }) =>
      id.toUpperCase() === "SIZE" &&
      value !== null &&
      /^\d+(?:[.,]\d+)?$/.test(value),
  )?.value;

  return (
    numericSize ??
    attributeValue(attributes, ["SIZE", "TALLE", "FILTRABLE_SIZE"])
  );
}

export function uniqueSortedSizes(values: readonly (string | null)[]) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
    .sort(comparePublicationSizes);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
