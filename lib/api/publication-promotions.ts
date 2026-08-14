import "server-only";

import {
  asArray,
  asRecord,
  firstBoolean,
  firstNumber,
  firstText,
} from "@/lib/api/api-shape";
import { apiGet, ApiRequestError } from "@/lib/server/api-fetch";
import type { PublicationPromotion } from "@/types/publication-commercial";

function mapPromotion(value: unknown): PublicationPromotion | null {
  const source = asRecord(value);
  const id = firstText(source, "id", "promotionId", "promotion_id");
  const type = firstText(source, "type", "promotionType", "promotion_type");

  if (!type) return null;

  return {
    id,
    type,
    status: firstText(source, "status", "promotionStatus", "promotion_status"),
    name: firstText(source, "name", "title"),
    itemId: firstText(source, "itemId", "item_id"),
    variationId: firstText(source, "variationId", "variation_id"),
    userProductId: firstText(source, "userProductId", "user_product_id"),
    regularPrice: firstNumber(source, "regularPrice", "regular_price"),
    promotionPrice: firstNumber(
      source,
      "promotionPrice",
      "promotion_price",
      "dealPrice",
      "deal_price",
    ),
    percentage: firstNumber(
      source,
      "percentage",
      "promotionPercentage",
      "promotion_percentage",
    ),
    startDate: firstText(source, "startDate", "start_date"),
    endDate: firstText(source, "endDate", "end_date"),
    canApply: firstBoolean(source, "canApply", "can_apply") ?? false,
    canRemove: firstBoolean(source, "canRemove", "can_remove") ?? false,
  };
}

export async function getPublicationPromotions(
  productId: string,
): Promise<readonly PublicationPromotion[]> {
  try {
    const response = await apiGet<unknown>(
      `/mercadolibre/publicaciones/${encodeURIComponent(productId)}/promotions`,
    );
    const root = asRecord(response);
    const values = Array.isArray(response)
      ? response
      : asArray(root?.promotions ?? root?.results ?? root?.items);

    return values
      .map(mapPromotion)
      .filter((value): value is PublicationPromotion => value !== null);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return [];
    throw error;
  }
}
