import "server-only";

import {
  asArray,
  asRecord,
  firstBoolean,
  firstText,
} from "@/lib/api/api-shape";
import { apiGet, ApiRequestError } from "@/lib/server/api-fetch";
import { normalizeAttributes, textOrNull } from "@/lib/api/publication-data";
import type {
  PublicationCapabilities,
  PublicationEditableAttribute,
  PublicationEditableField,
} from "@/types/publication-capabilities";

function field(value: unknown): PublicationEditableField {
  if (typeof value === "boolean") return { editable: value, reason: null };

  const source = asRecord(value);
  return {
    editable: firstBoolean(source, "editable", "allowed") ?? false,
    reason: firstText(source, "reason", "message"),
  };
}

function attribute(value: unknown): PublicationEditableAttribute | null {
  const source = asRecord(value);
  const id = firstText(source, "id");
  const name = firstText(source, "name") ?? id;

  if (!id || !name) return null;

  return {
    id,
    name,
    valueId: firstText(
      source,
      "valueId",
      "value_id",
      "currentValueId",
      "current_value_id",
    ),
    value: firstText(source, "value", "valueName", "value_name"),
    required: firstBoolean(source, "required") ?? false,
    valueType: firstText(source, "valueType", "value_type"),
    allowCustomValue:
      firstBoolean(source, "allowCustomValue", "allow_custom_value") ?? false,
    allowedValues: asArray(source?.allowedValues ?? source?.allowed_values ?? source?.values)
      .map((rawValue) => {
        const raw = asRecord(rawValue);
        const valueId = firstText(raw, "id");
        const valueName = firstText(raw, "name", "value_name");
        return valueId && valueName ? { id: valueId, name: valueName } : null;
      })
      .filter(
        (value): value is Readonly<{ id: string; name: string }> =>
          value !== null,
      ),
  };
}

export async function getPublicationCapabilities(
  productId: string,
  itemId?: string,
): Promise<PublicationCapabilities | null> {
  try {
    const response = await apiGet<unknown>(
      `/mercadolibre/publicaciones/${encodeURIComponent(productId)}/capabilities`,
      { params: { itemId } },
    );
    const root = asRecord(response);
    const fields = asRecord(root?.fields) ?? root;
    const promotions = asRecord(root?.promotions);
    const currentContent = asRecord(root?.currentContent ?? root?.current_content);

    return {
      itemId: firstText(root, "itemId", "item_id"),
      title: field(fields?.title),
      description: field(fields?.description),
      attributes: field(fields?.attributes),
      editableAttributes: asArray(
        root?.editableAttributes ?? root?.editable_attributes ?? root?.attributes,
      )
        .map(attribute)
        .filter(
          (value): value is PublicationEditableAttribute => value !== null,
        ),
      currentContent: {
        title: textOrNull(currentContent?.title),
        description: textOrNull(currentContent?.description),
        attributes: normalizeAttributes(currentContent?.attributes),
      },
      priceDiscountApply:
        firstBoolean(
          promotions,
          "priceDiscountApply",
          "price_discount_apply",
        ) ?? false,
      priceDiscountRemove:
        firstBoolean(
          promotions,
          "priceDiscountRemove",
          "price_discount_remove",
        ) ?? false,
    };
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return null;
    throw error;
  }
}
