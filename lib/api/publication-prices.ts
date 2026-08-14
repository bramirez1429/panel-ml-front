import "server-only";

import {
  asArray,
  asRecord,
  firstNumber,
  firstText,
} from "@/lib/api/api-shape";
import { apiGet, ApiRequestError } from "@/lib/server/api-fetch";
import type {
  PublicationPrices,
  PublicationPriceSummary,
} from "@/types/publication-commercial";

function mapPrice(value: unknown): PublicationPriceSummary {
  const source = asRecord(value);

  return {
    itemId: firstText(source, "itemId", "item_id"),
    variationId: firstText(source, "variationId", "variation_id"),
    userProductId: firstText(source, "userProductId", "user_product_id"),
    currencyId: firstText(source, "currencyId", "currency_id"),
    standardPrice: firstNumber(source, "standardPrice", "standard_price"),
    salePrice: firstNumber(source, "salePrice", "sale_price"),
    regularPrice: firstNumber(source, "regularPrice", "regular_price"),
    promotionPrice: firstNumber(
      source,
      "promotionPrice",
      "promotion_price",
    ),
    promotionPercentage: firstNumber(
      source,
      "promotionPercentage",
      "promotion_percentage",
    ),
    promotionId: firstText(source, "promotionId", "promotion_id"),
    promotionType: firstText(source, "promotionType", "promotion_type"),
    promotionStatus: firstText(
      source,
      "promotionStatus",
      "promotion_status",
    ),
    promotionStartDate: firstText(
      source,
      "promotionStartDate",
      "promotion_start_date",
    ),
    promotionEndDate: firstText(
      source,
      "promotionEndDate",
      "promotion_end_date",
    ),
  };
}

export async function getPublicationPrices(
  productId: string,
): Promise<PublicationPrices | null> {
  try {
    const response = await apiGet<unknown>(
      `/mercadolibre/publicaciones/${encodeURIComponent(productId)}/prices`,
    );
    const root = asRecord(response);
    const targetsSource =
      root?.targets ?? root?.prices ?? root?.items ?? root?.children;
    const targets = asArray(targetsSource).map(mapPrice);
    const summarySource = root?.summary ?? root?.price ?? response;

    return {
      productId,
      summary: mapPrice(summarySource),
      targets,
    };
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    throw error;
  }
}

