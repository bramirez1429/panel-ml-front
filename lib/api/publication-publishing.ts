import "server-only";

import {
  asArray,
  asRecord,
  firstBoolean,
  firstNumber,
  firstText,
} from "@/lib/api/api-shape";
import { apiGet } from "@/lib/server/api-fetch";
import type {
  PublicationAttributeValue,
  PublicationCategory,
  PublicationCategoryAttribute,
  PublicationCategorySchema,
} from "@/types/publication-publishing";

function mapCategory(value: unknown): PublicationCategory | null {
  const source = asRecord(value);
  const id = firstText(source, "id", "categoryId", "category_id");
  const name = firstText(source, "name", "title");
  if (!id || !name) return null;

  const pathValue = source?.path;
  const path = Array.isArray(pathValue)
    ? pathValue
        .map((part) => {
          const record = asRecord(part);
          return firstText(record, "name") ?? (typeof part === "string" ? part : null);
        })
        .filter((part): part is string => part !== null)
        .join(" > ")
    : firstText(source, "path", "fullName", "full_name");

  return { id, name, path: path || null };
}

function mapValue(value: unknown): PublicationAttributeValue | null {
  const source = asRecord(value);
  const id = firstText(source, "id");
  const name = firstText(source, "name", "value_name");
  return id && name ? { id, name } : null;
}

function mapAttribute(value: unknown): PublicationCategoryAttribute | null {
  const source = asRecord(value);
  const id = firstText(source, "id");
  const name = firstText(source, "name") ?? id;
  if (!id || !name) return null;

  const tags = asRecord(source?.tags);
  const rawRole = firstText(source, "role", "hierarchy", "attributeRole", "attribute_role")
    ?.toUpperCase()
    .replaceAll("-", "_");
  const role =
    rawRole === "CHILD_PK" || firstBoolean(tags, "child_pk", "childPk")
      ? "CHILD_PK"
      : rawRole === "PARENT_PK" || firstBoolean(tags, "parent_pk", "parentPk")
        ? "PARENT_PK"
        : "COMMON";

  return {
    id,
    name,
    required:
      firstBoolean(source, "required") ??
      firstBoolean(
        tags,
        "required",
        "catalog_required",
        "catalog_listing_required",
      ) ??
      false,
    requiredOnNew:
      firstBoolean(source, "requiredOnNew", "required_on_new") ??
      firstBoolean(tags, "new_required") ??
      false,
    valueType: firstText(source, "valueType", "value_type"),
    role,
    inputAllowed:
      firstBoolean(source, "inputAllowed", "input_allowed") ?? true,
    valueMaxLength: firstNumber(source, "valueMaxLength", "value_max_length"),
    values: asArray(source?.values)
      .map(mapValue)
      .filter((item): item is PublicationAttributeValue => item !== null),
  };
}

function mapOptions(value: unknown) {
  return asArray(value)
    .map((item) => {
      const source = asRecord(item);
      const id = firstText(source, "id");
      const name = firstText(source, "name") ?? id;
      return id && name ? { id, name } : null;
    })
    .filter((item): item is Readonly<{ id: string; name: string }> => item !== null);
}

export async function searchCategories(query: string) {
  const response = await apiGet<unknown>(
    "/mercadolibre/publicaciones/categories/search",
    { params: { q: query } },
  );
  const root = asRecord(response);
  const values = Array.isArray(response)
    ? response
    : asArray(root?.categories ?? root?.results);

  return values
    .map(mapCategory)
    .filter((item): item is PublicationCategory => item !== null);
}

export async function getCategorySchema(categoryId: string): Promise<PublicationCategorySchema> {
  const response = await apiGet<unknown>(
    `/mercadolibre/publicaciones/categories/${encodeURIComponent(categoryId)}/attributes`,
  );
  const root = asRecord(response);
  const category = mapCategory(root?.category) ?? {
    id: categoryId,
    name: firstText(root, "categoryName", "category_name") ?? categoryId,
    path: null,
  };
  const settings = asRecord(root?.settings);

  return {
    category,
    usesUserProducts:
      firstBoolean(root, "usesUserProducts", "uses_user_products") ??
      firstBoolean(settings, "userProducts", "user_products") ??
      false,
    familyNameRequired:
      firstBoolean(root, "familyNameRequired", "family_name_required") ?? false,
    attributes: asArray(root?.attributes)
      .map(mapAttribute)
      .filter((item): item is PublicationCategoryAttribute => item !== null),
    saleTerms: asArray(root?.saleTerms ?? root?.sale_terms)
      .map(mapAttribute)
      .filter((item): item is PublicationCategoryAttribute => item !== null),
    listingTypes: mapOptions(root?.listingTypes ?? root?.listing_types),
    conditions: mapOptions(root?.conditions),
    settings: {
      listingAllowed: firstBoolean(settings, "listingAllowed", "listing_allowed"),
      maxPictures: firstNumber(settings, "maxPictures", "max_pictures"),
      maxPicturesPerVariation: firstNumber(
        settings,
        "maxPicturesPerVariation",
        "max_pictures_per_variation",
      ),
      maxVariations: firstNumber(settings, "maxVariations", "max_variations"),
      shippingModes: asArray(settings?.shippingModes ?? settings?.shipping_modes)
        .filter((value): value is string => typeof value === "string"),
    },
  };
}
