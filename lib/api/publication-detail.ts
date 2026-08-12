import "server-only";

import {
  asFiniteNumber,
  attributeValue,
  createPrice,
  normalizeAttributes,
  normalizeThumbnail,
  textOrNull,
  uniqueSortedSizes,
} from "@/lib/api/publication-data";
import { apiGet, ApiRequestError } from "@/lib/server/api-fetch";
import type {
  PublicationDetail,
  PublicationModel,
  SharedVariationDetail,
  VariantPricingChildDetail,
} from "@/types/publication";

type ApiProduct = Readonly<{
  id: string;
  model: PublicationModel;
  family_id: string | null;
  parent_item_id: string | null;
  family_name: string | null;
  title: string | null;
  thumbnail: string | null;
  status: string | null;
  currency_id: string | null;
  price_from: number | null;
  price_to: number | null;
  stock_total: number | null;
  children_count: number | null;
  permalink: string | null;
  shared_variations?: unknown;
  regular_price?: number | null;
  regular_price_from?: number | null;
  regular_price_to?: number | null;
  original_price?: number | null;
  promotion_percentage?: number | null;
  estimated_profit?: number | null;
  visits?: number | null;
  has_flex?: boolean | null;
}>;

type ApiChild = Readonly<{
  id: string;
  item_id: string | null;
  user_product_id: string | null;
  title: string | null;
  thumbnail: string | null;
  status: string | null;
  currency_id: string | null;
  listing_type_id: string | null;
  price: number | null;
  available_quantity: number | null;
  sold_quantity: number | null;
  attributes?: unknown;
  permalink: string | null;
}>;

type ApiSharedVariation = Readonly<{
  id: string;
  label?: string | null;
  availableQuantity?: number | null;
  soldQuantity?: number | null;
  attributes?: unknown;
}>;

type ApiPublicationDetailResponse = Readonly<{
  product: ApiProduct;
  children?: readonly ApiChild[];
}>;

function mapSharedVariation(
  variation: ApiSharedVariation,
): SharedVariationDetail {
  const attributes = normalizeAttributes(variation.attributes);

  return {
    id: variation.id,
    label: textOrNull(variation.label),
    color: attributeValue(attributes, ["COLOR", "MAIN_COLOR"]),
    size: attributeValue(attributes, ["FILTRABLE_SIZE", "SIZE", "TALLE"]),
    availableQuantity: asFiniteNumber(variation.availableQuantity),
    soldQuantity: asFiniteNumber(variation.soldQuantity),
    attributes,
  };
}

function mapChild(child: ApiChild): VariantPricingChildDetail {
  const attributes = normalizeAttributes(child.attributes);

  return {
    id: child.id,
    title: textOrNull(child.title),
    thumbnail: normalizeThumbnail(child.thumbnail),
    itemId: textOrNull(child.item_id),
    userProductId: textOrNull(child.user_product_id),
    color: attributeValue(attributes, ["COLOR", "MAIN_COLOR"]),
    size: attributeValue(attributes, ["SIZE"]),
    filterableSize: attributeValue(attributes, ["FILTRABLE_SIZE"]),
    sku: attributeValue(attributes, ["SELLER_SKU", "SKU"]),
    price: asFiniteNumber(child.price),
    currencyId: textOrNull(child.currency_id),
    availableQuantity: asFiniteNumber(child.available_quantity),
    soldQuantity: asFiniteNumber(child.sold_quantity),
    status: textOrNull(child.status),
    listingTypeId: textOrNull(child.listing_type_id),
    permalink: safeExternalUrl(child.permalink),
    attributes,
  };
}

function mapDetail(
  response: ApiPublicationDetailResponse,
): PublicationDetail {
  const product = response.product;
  const rawSharedVariations = asArray<ApiSharedVariation>(
    product.shared_variations,
  );
  const rawChildren = asArray<ApiChild>(response.children);
  const sharedVariations = (rawSharedVariations ?? []).map(mapSharedVariation);
  const children = (rawChildren ?? []).map(mapChild);
  const currencyId = textOrNull(product.currency_id);
  const regularPrice =
    product.regular_price_from ??
    product.regular_price ??
    product.original_price;
  const sizes = uniqueSortedSizes(
    product.model === "SHARED"
      ? sharedVariations.map(({ size }) => size)
      : children.map(({ size, filterableSize }) => filterableSize ?? size),
  );

  return {
    id: product.id,
    model: product.model,
    familyId: textOrNull(product.family_id),
    parentItemId: textOrNull(product.parent_item_id),
    title: textOrNull(product.title) ?? textOrNull(product.family_name),
    thumbnail: normalizeThumbnail(product.thumbnail),
    status: textOrNull(product.status),
    currencyId,
    stockTotal: asFiniteNumber(product.stock_total),
    variantsCount:
      product.model === "SHARED"
        ? rawSharedVariations === null
          ? null
          : sharedVariations.length
        : asFiniteNumber(product.children_count) ??
          (rawChildren === null ? null : children.length),
    sizes: sizes.length > 0 ? sizes : null,
    currentPrice: createPrice(
      product.price_from,
      product.price_to,
      currencyId,
    ),
    regularPrice: createPrice(
      regularPrice,
      product.regular_price_to,
      currencyId,
    ),
    promotionPercentage: asFiniteNumber(product.promotion_percentage),
    estimatedProfit: asFiniteNumber(product.estimated_profit),
    visits: asFiniteNumber(product.visits),
    hasFlex:
      typeof product.has_flex === "boolean" ? product.has_flex : null,
    permalink: safeExternalUrl(product.permalink),
    sharedVariations,
    children,
  };
}

export async function getPublicationDetail(productId: string) {
  try {
    const response = await apiGet<ApiPublicationDetailResponse>(
      `/mercadolibre/publicaciones/detalle/${encodeURIComponent(productId)}`,
    );

    return mapDetail(response);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

function asArray<T>(value: unknown): readonly T[] | null {
  return Array.isArray(value) ? (value as readonly T[]) : null;
}

function safeExternalUrl(value: unknown) {
  const text = textOrNull(value);

  if (!text) {
    return null;
  }

  try {
    const url = new URL(text);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
