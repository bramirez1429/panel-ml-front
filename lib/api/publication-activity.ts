import "server-only";

import {
  asArray,
  asRecord,
  firstText,
} from "@/lib/api/api-shape";
import { apiGet, ApiRequestError } from "@/lib/server/api-fetch";
import type {
  PublicationAction,
  PublicationActionStatus,
} from "@/types/publication-activity";

function mapAction(value: unknown): PublicationAction | null {
  const source = asRecord(value);
  const id = firstText(source, "id");
  const action = firstText(source, "action");
  const rawStatus = firstText(source, "status")?.toUpperCase();
  const createdAt = firstText(source, "createdAt", "created_at");

  if (
    !id ||
    !action ||
    !createdAt ||
    (rawStatus !== "SUCCESS" && rawStatus !== "FAILED")
  ) {
    return null;
  }

  return {
    id,
    action,
    status: rawStatus as PublicationActionStatus,
    itemId: firstText(source, "itemId", "item_id"),
    oldValue: source?.oldValue ?? source?.old_value ?? null,
    newValue: source?.newValue ?? source?.new_value ?? null,
    errorMessage: firstText(source, "errorMessage", "error_message"),
    createdAt,
  };
}

export async function getPublicationActivity(
  productId: string,
): Promise<readonly PublicationAction[]> {
  try {
    const response = await apiGet<unknown>(
      `/mercadolibre/publicaciones/${encodeURIComponent(productId)}/activity`,
      { params: { limit: 20 } },
    );
    const root = asRecord(response);
    const values = Array.isArray(response)
      ? response
      : asArray(root?.activities ?? root?.actions ?? root?.activity ?? root?.results);

    return values
      .map(mapAction)
      .filter((value): value is PublicationAction => value !== null);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return [];
    throw error;
  }
}
