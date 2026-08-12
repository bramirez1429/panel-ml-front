import "server-only";

import {
  asFiniteNumber,
  createPrice,
  normalizeThumbnail,
  preferredSize,
  textOrNull,
  uniqueSortedSizes,
} from "@/lib/api/publication-data";
import { apiGet } from "@/lib/server/api-fetch";
import type {
  Publication,
  PublicationModel,
  PublicationsPage,
} from "@/types/publication";

type ApiVariation = Readonly<{
  size?: string | number | null;
  talle?: string | number | null;
  attributes?: unknown;
  attribute_combinations?: unknown;
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
  variants_count?: number | null;
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

function readSize(variation: ApiVariation) {
  const directValue = variation.size ?? variation.talle;

  if (directValue !== null && directValue !== undefined) {
    return String(directValue).trim();
  }

  return preferredSize([
    ...asArray(variation.attribute_combinations),
    ...asArray(variation.attributes),
  ]);
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

  return uniqueSortedSizes(values);
}

function getVariantsCount(publication: ApiPublication) {
  const aggregatedCount = asFiniteNumber(publication.variants_count);

  if (aggregatedCount !== null) {
    return aggregatedCount;
  }

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
  const currencyId = textOrNull(publication.currency_id);
  const regularPrice =
    publication.regular_price_from ??
    publication.regular_price ??
    publication.original_price;
  const currentPrice = publication.price_from ?? publication.price;

  return {
    id: publication.id,
    model: publication.model,
    title: textOrNull(publication.title) ?? textOrNull(publication.family_name),
    thumbnail: normalizeThumbnail(publication.thumbnail),
    status: textOrNull(publication.status),
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

function asArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
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
