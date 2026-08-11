import "server-only";

import { apiGet } from "@/lib/server/api-fetch";
import type {
  Publication,
  PublicationModel,
  PublicationPrice,
  PublicationsPage,
} from "@/types/publication";

type ApiAttribute = Readonly<{
  id?: string | null;
  name?: string | null;
  value?: string | number | null;
  value_name?: string | null;
}>;

type ApiVariation = Readonly<{
  size?: string | number | null;
  talle?: string | number | null;
  attributes?: readonly ApiAttribute[] | null;
  attribute_combinations?: readonly ApiAttribute[] | null;
}>;

type ApiPublication = Readonly<{
  id: string;
  external_key: string;
  model: PublicationModel;
  title: string | null;
  family_name: string | null;
  thumbnail: string | null;
  status: string | null;
  currency_id: string | null;
  price_from: number | null;
  price_to: number | null;
  price?: number | null;
  stock_total: number | null;
  children_count: number | null;
  children?: readonly ApiVariation[] | null;
  shared_variations?: readonly ApiVariation[] | null;
  sizes?: readonly (string | number)[] | null;
  talles?: readonly (string | number)[] | null;
  regular_price?: number | null;
  regular_price_from?: number | null;
  regular_price_to?: number | null;
  original_price?: number | null;
  promotion_percentage?: number | null;
  estimated_profit?: number | null;
  visits?: number | null;
  has_flex?: boolean | null;
}>;

type ApiPublicationsResponse = Readonly<{
  paging: Readonly<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }>;
  count: number;
  publications: readonly ApiPublication[];
}>;

type GetPublicationsOptions = Readonly<{
  page: number;
  limit: number;
}>;

function asFiniteNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function createPrice(
  fromValue: number | null | undefined,
  toValue: number | null | undefined,
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

function normalizeThumbnail(thumbnail: string | null) {
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

function readSize(variation: ApiVariation) {
  const directValue = variation.size ?? variation.talle;

  if (directValue !== null && directValue !== undefined) {
    return String(directValue).trim();
  }

  const attributes = [
    ...(variation.attribute_combinations ?? []),
    ...(variation.attributes ?? []),
  ];

  const sizeAttribute = attributes.find((attribute) => {
    const key = `${attribute.id ?? ""} ${attribute.name ?? ""}`.toUpperCase();
    return key.includes("SIZE") || key.includes("TALLE");
  });

  const attributeValue = sizeAttribute?.value_name ?? sizeAttribute?.value;
  return attributeValue === null || attributeValue === undefined
    ? null
    : String(attributeValue).trim();
}

function extractSizes(publication: ApiPublication) {
  const variations =
    publication.model === "SHARED"
      ? publication.shared_variations
      : publication.children;

  const values = [
    ...(publication.sizes ?? []),
    ...(publication.talles ?? []),
    ...(variations ?? []).map(readSize),
  ]
    .filter((value): value is string | number => value !== null)
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (values.length === 0) {
    return null;
  }

  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "es", { numeric: true }),
  );
}

function getVariantsCount(publication: ApiPublication) {
  if (publication.model === "VARIANT_PRICING") {
    return (
      asFiniteNumber(publication.children_count) ??
      publication.children?.length ??
      null
    );
  }

  return publication.shared_variations?.length ?? null;
}

function mapPublication(publication: ApiPublication): Publication {
  const currencyId = publication.currency_id || null;
  const regularPrice =
    publication.regular_price_from ??
    publication.regular_price ??
    publication.original_price;
  const currentPrice = publication.price_from ?? publication.price;

  return {
    id: publication.id,
    model: publication.model,
    title: publication.title || publication.family_name || null,
    thumbnail: normalizeThumbnail(publication.thumbnail),
    status: publication.status || null,
    currencyId,
    stockTotal: asFiniteNumber(publication.stock_total),
    variantsCount: getVariantsCount(publication),
    sizes: extractSizes(publication),
    currentPrice: createPrice(
      currentPrice,
      publication.price_to,
      currencyId,
    ),
    regularPrice: createPrice(
      regularPrice,
      publication.regular_price_to ?? regularPrice,
      currencyId,
    ),
    promotionPercentage: asFiniteNumber(
      publication.promotion_percentage,
    ),
    estimatedProfit: asFiniteNumber(publication.estimated_profit),
    visits: asFiniteNumber(publication.visits),
    hasFlex:
      typeof publication.has_flex === "boolean"
        ? publication.has_flex
        : null,
  };
}

export async function getPublications({
  page,
  limit,
}: GetPublicationsOptions): Promise<PublicationsPage> {
  const response = await apiGet<ApiPublicationsResponse>(
    "/mercadolibre/publicaciones",
    { params: { page, limit } },
  );
  const seen = new Set<string>();
  const publications: Publication[] = [];

  for (const item of response.publications) {
    const identity = item.external_key || item.id;

    if (!seen.has(identity)) {
      seen.add(identity);
      publications.push(mapPublication(item));
    }
  }

  return {
    publications,
    paging: response.paging,
  };
}
