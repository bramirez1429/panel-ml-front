"use server";

import {
  getCategorySchema,
  searchCategories,
} from "@/lib/api/publication-publishing";
import { apiAction } from "@/lib/server/api-action";
import { ApiRequestError } from "@/lib/server/api-fetch";
import type {
  CategorySchemaActionResult,
  CategorySearchActionResult,
  PublicationDraft,
  PublicationDraftAttribute,
  PublicationDraftVariation,
  PublicationPublishActionResult,
  PublicationValidationActionResult,
  PublicationValidationIssue,
} from "@/types/publication-publishing";

const CATEGORY_PATTERN = /^MLA\d+$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function searchPublicationCategories(
  query: string,
): Promise<CategorySearchActionResult> {
  const normalized = typeof query === "string" ? query.trim() : "";
  if (normalized.length < 2 || normalized.length > 120) {
    return { ok: false, status: 400, error: "Ingresá al menos 2 caracteres" };
  }

  try {
    return { ok: true, categories: await searchCategories(normalized) };
  } catch (error) {
    return requestFailure(error, "No se pudieron buscar categorías");
  }
}

export async function loadPublicationCategory(
  categoryId: string,
): Promise<CategorySchemaActionResult> {
  if (typeof categoryId !== "string" || !CATEGORY_PATTERN.test(categoryId)) {
    return { ok: false, status: 400, error: "La categoría no es válida" };
  }

  try {
    return { ok: true, schema: await getCategorySchema(categoryId) };
  } catch (error) {
    return requestFailure(error, "No se pudieron cargar los atributos de la categoría");
  }
}

export async function validatePublicationDraft(
  draft: PublicationDraft,
): Promise<PublicationValidationActionResult> {
  const normalized = normalizeDraft(draft);
  if ("error" in normalized) {
    return { ok: false, status: 400, error: normalized.error };
  }

  const response = await apiAction<unknown>(
    "/mercadolibre/publicaciones/validate",
    {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(normalized.draft),
    },
    180_000,
  );

  if (!response.ok) return response;
  const body = asRecord(response.data);
  const issues = readIssues(body?.issues ?? body?.cause ?? body?.errors);

  return {
    ok: true,
    result: {
      valid: typeof body?.valid === "boolean" ? body.valid : issues.length === 0,
      issues,
      preview: body?.preview ?? body?.payload ?? response.data,
    },
  };
}

export async function publishPublication(
  draft: PublicationDraft,
): Promise<PublicationPublishActionResult> {
  const normalized = normalizeDraft(draft);
  if ("error" in normalized) {
    return { ok: false, status: 400, error: normalized.error };
  }

  const response = await apiAction<unknown>(
    "/mercadolibre/publicaciones",
    {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(normalized.draft),
    },
    180_000,
  );

  if (!response.ok) return response;
  const body = asRecord(response.data);
  const product = asRecord(body?.product);
  const productId = text(body?.productId ?? body?.product_id ?? product?.id);

  if (!productId || !UUID_PATTERN.test(productId)) {
    return {
      ok: false,
      status: 502,
      error: "Mercado Libre publicó, pero el backend no devolvió el productId interno",
    };
  }

  return { ok: true, productId };
}

function normalizeDraft(
  value: PublicationDraft,
): Readonly<{ draft: PublicationDraft }> | Readonly<{ error: string }> {
  if (!isRecord(value) || !CATEGORY_PATTERN.test(text(value.categoryId) ?? "")) {
    return { error: "Seleccioná una categoría válida" };
  }

  const title = text(value.title);
  const familyName = text(value.familyName);
  const currencyId = text(value.currencyId);
  const listingTypeId = text(value.listingTypeId);
  const condition = text(value.condition);

  if (!title && !familyName) {
    return { error: "Ingresá un título o el family name requerido" };
  }
  if (!currencyId) return { error: "Ingresá la moneda" };
  if (!listingTypeId) return { error: "Seleccioná el tipo de publicación" };
  if (!condition) return { error: "Seleccioná la condición" };
  if (!positiveNumber(value.price)) return { error: "El precio debe ser mayor a 0" };
  if (!stock(value.stock)) return { error: "El stock no es válido" };

  const attributes = normalizeAttributes(value.attributes);
  if (!attributes) return { error: "Los atributos comunes no son válidos" };
  const variations = normalizeVariations(value.variations);
  if (!variations) return { error: "Las variantes no son válidas" };
  const pictures = normalizePictures(value.pictures);
  if (!pictures) return { error: "Las URLs de imágenes no son válidas" };
  const saleTerms = normalizeAttributes(value.saleTerms);
  if (!saleTerms) return { error: "Los términos de venta no son válidos" };
  const shipping = isRecord(value.shipping) ? value.shipping : {};

  return {
    draft: {
      categoryId: value.categoryId,
      ...(title ? { title } : {}),
      ...(familyName ? { familyName } : {}),
      currencyId,
      price: value.price,
      stock: value.stock,
      listingTypeId,
      condition,
      ...(text(value.description) ? { description: text(value.description) as string } : {}),
      attributes,
      saleTerms,
      variations,
      pictures,
      shipping: {
        ...(text(shipping.mode) ? { mode: text(shipping.mode) as string } : {}),
        ...(typeof shipping.freeShipping === "boolean"
          ? { freeShipping: shipping.freeShipping }
          : {}),
        ...(typeof shipping.localPickup === "boolean"
          ? { localPickup: shipping.localPickup }
          : {}),
      },
    },
  };
}

function normalizeVariations(value: unknown): readonly PublicationDraftVariation[] | null {
  if (!Array.isArray(value) || value.length > 100) return null;

  const result: PublicationDraftVariation[] = [];
  for (const variation of value) {
    if (!isRecord(variation) || !positiveNumber(variation.price) || !stock(variation.stock)) {
      return null;
    }
    const attributes = normalizeAttributes(variation.attributes);
    const pictures = normalizePictures(variation.pictures);
    if (!attributes || !pictures) return null;
    result.push({
      sku: text(variation.sku) ?? "",
      price: variation.price,
      stock: variation.stock,
      attributes,
      pictures,
    });
  }
  return result;
}

function normalizeAttributes(value: unknown): readonly PublicationDraftAttribute[] | null {
  if (!Array.isArray(value) || value.length > 200) return null;
  const result: PublicationDraftAttribute[] = [];
  for (const attribute of value) {
    if (!isRecord(attribute)) return null;
    const id = text(attribute.id);
    const valueId = text(attribute.valueId);
    const valueName = text(attribute.valueName);
    if (!id || (!valueId && !valueName)) return null;
    result.push({ id, ...(valueId ? { valueId } : {}), ...(valueName ? { valueName } : {}) });
  }
  return result;
}

function normalizePictures(value: unknown): readonly string[] | null {
  if (!Array.isArray(value) || value.length > 50) return null;
  const pictures: string[] = [];
  for (const picture of value) {
    const url = text(picture);
    if (!url) return null;
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") return null;
      pictures.push(parsed.toString());
    } catch {
      return null;
    }
  }
  return pictures;
}

function readIssues(value: unknown): readonly PublicationValidationIssue[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((issue) => {
    if (typeof issue === "string") {
      return [{ code: null, field: null, message: issue, itemIndex: null }];
    }
    const source = asRecord(issue);
    const message = text(source?.message ?? source?.description);
    return message
      ? [{
          code: text(source?.code),
          field: text(source?.field),
          message,
          itemIndex:
            typeof source?.itemIndex === "number" ? source.itemIndex : null,
        }]
      : [];
  });
}

function requestFailure<T>(error: unknown, fallback: string): T {
  if (error instanceof ApiRequestError) {
    return { ok: false, status: error.status, error: fallback } as T;
  }
  return { ok: false, status: 502, error: fallback } as T;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function positiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function stock(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}
