"use server";

import { apiAction } from "@/lib/server/api-action";
import type {
  PriceDiscountCommand,
  PublicationAttributeUpdate,
  PublicationContentResult,
} from "@/types/publication-content";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ITEM_ID_PATTERN = /^MLA\d+$/;
const VARIATION_ID_PATTERN = /^\d+$/;
const USER_PRODUCT_ID_PATTERN = /^MLAU\d+$/;

export async function updatePublicationTitle(
  productId: string,
  title: string,
  itemId?: string,
): Promise<PublicationContentResult> {
  if (!isUuid(productId) || typeof title !== "string" || !title.trim()) {
    return badRequest("El título no es válido");
  }

  if (title.trim().length > 500) {
    return badRequest("El título es demasiado largo");
  }

  if (itemId !== undefined && !ITEM_ID_PATTERN.test(itemId)) {
    return badRequest("El MLA no es válido");
  }
  return sendPatch(productId, "title", {
    title: title.trim(),
    ...(itemId ? { itemId } : {}),
  });
}

export async function updatePublicationDescription(
  productId: string,
  description: string,
  itemId?: string,
): Promise<PublicationContentResult> {
  if (!isUuid(productId) || typeof description !== "string") {
    return badRequest("La descripción no es válida");
  }

  if (description.length > 50_000) {
    return badRequest("La descripción es demasiado larga");
  }

  if (itemId !== undefined && !ITEM_ID_PATTERN.test(itemId)) {
    return badRequest("El MLA no es válido");
  }
  return sendPatch(productId, "description", {
    description: description.trim(),
    ...(itemId ? { itemId } : {}),
  });
}

export async function updatePublicationAttributes(
  productId: string,
  attributes: readonly PublicationAttributeUpdate[],
  itemId?: string,
): Promise<PublicationContentResult> {
  if (!isUuid(productId) || !Array.isArray(attributes) || attributes.length > 100) {
    return badRequest("Los atributos no son válidos");
  }
  if (itemId !== undefined && !ITEM_ID_PATTERN.test(itemId)) {
    return badRequest("El MLA no es válido");
  }

  const normalized: PublicationAttributeUpdate[] = [];

  for (const attribute of attributes) {
    if (!isRecord(attribute) || typeof attribute.id !== "string" || !attribute.id.trim()) {
      return badRequest("Hay un atributo inválido");
    }

    const valueId = text(attribute.valueId);
    const valueName = text(attribute.valueName);
    const clearing = attribute.valueId === null && attribute.valueName === null;

    if (!valueId && !valueName && !clearing) {
      return badRequest(`Completá el atributo ${attribute.id}`);
    }

    normalized.push({
      id: attribute.id.trim(),
      ...(clearing ? { valueId: null, valueName: null } : {}),
      ...(!clearing && valueId ? { valueId } : {}),
      ...(!clearing && valueName ? { valueName } : {}),
    });
  }

  return sendPatch(productId, "attributes", {
    attributes: normalized,
    ...(itemId ? { itemId } : {}),
  });
}

export async function applyPriceDiscount(
  command: PriceDiscountCommand,
): Promise<PublicationContentResult> {
  const validation = validatePromotionCommand(command, true);
  if ("error" in validation) return badRequest(validation.error);

  return sendPromotion(command.productId, "POST", validation.body);
}

export async function removePriceDiscount(
  command: PriceDiscountCommand,
): Promise<PublicationContentResult> {
  const validation = validatePromotionCommand(command, false);
  if ("error" in validation) return badRequest(validation.error);

  return sendPromotion(command.productId, "DELETE", validation.body);
}

function validatePromotionCommand(
  command: PriceDiscountCommand,
  requiresPrice: boolean,
): Readonly<{ body: Record<string, string | number> }> | Readonly<{ error: string }> {
  if (!isRecord(command) || !isUuid(command.productId)) {
    return { error: "La publicación no es válida" };
  }

  if (
    requiresPrice &&
    (typeof command.dealPrice !== "number" ||
      !Number.isFinite(command.dealPrice) ||
      command.dealPrice <= 0)
  ) {
    return { error: "Ingresá un precio promocional mayor a 0" };
  }

  const startDate = text(command.startDate);
  const finishDate = text(command.finishDate);
  if (requiresPrice && (!startDate || !finishDate)) {
    return { error: "Ingresá el inicio y el fin de la promoción" };
  }

  if (requiresPrice) {
    const start = Date.parse(startDate as string);
    const finish = Date.parse(finishDate as string);
    const startDay = utcDay(startDate as string);
    const finishDay = utcDay(finishDate as string);
    const calendarDays =
      Math.floor((finishDay - startDay) / 86_400_000) + 1;
    if (
      !Number.isFinite(start) ||
      !Number.isFinite(finish) ||
      finish <= start ||
      calendarDays < 1 ||
      calendarDays > 14
    ) {
      return { error: "La promoción debe durar como máximo 14 días" };
    }
  }

  if (command.itemId !== undefined && !ITEM_ID_PATTERN.test(command.itemId)) {
    return { error: "El MLA no es válido" };
  }
  if (
    command.variationId !== undefined &&
    !VARIATION_ID_PATTERN.test(command.variationId)
  ) {
    return { error: "La variación no es válida" };
  }
  if (
    command.userProductId !== undefined &&
    !USER_PRODUCT_ID_PATTERN.test(command.userProductId)
  ) {
    return { error: "El MLAU no es válido" };
  }

  return {
    body: {
      ...(requiresPrice ? { dealPrice: command.dealPrice as number } : {}),
      ...(requiresPrice ? { startDate: startDate as string } : {}),
      ...(requiresPrice ? { finishDate: finishDate as string } : {}),
      ...(command.itemId ? { itemId: command.itemId } : {}),
      ...(command.variationId ? { variationId: command.variationId } : {}),
      ...(command.userProductId ? { userProductId: command.userProductId } : {}),
    },
  };
}

async function sendPatch(
  productId: string,
  resource: string,
  body: Record<string, unknown>,
): Promise<PublicationContentResult> {
  const result = await apiAction(
    `/mercadolibre/publicaciones/${encodeURIComponent(productId)}/${resource}`,
    {
      method: "PATCH",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  return result.ok ? { ok: true } : result;
}

async function sendPromotion(
  productId: string,
  method: "POST" | "DELETE",
  body: Record<string, string | number>,
): Promise<PublicationContentResult> {
  const result = await apiAction(
    `/mercadolibre/publicaciones/${encodeURIComponent(productId)}/promotions/price-discount`,
    {
      method,
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  return result.ok ? { ok: true } : result;
}

function badRequest(error: string): PublicationContentResult {
  return { ok: false, status: 400, error };
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function utcDay(value: string): number {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}
