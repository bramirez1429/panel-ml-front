"use server";

import type {
  PublicationManagementResult,
  PublicationSkuCommand,
  PublicationStatusCommand,
} from "@/types/publication-management";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ITEM_ID_PATTERN = /^MLA\d+$/;
const VARIATION_ID_PATTERN = /^\d+$/;
const PICTURE_ID_PATTERN = /^[A-Za-z0-9_-]{1,200}$/;
const MAX_SKU_LENGTH = 64;
const MAX_PICTURE_SIZE = 10 * 1024 * 1024;
const ALLOWED_PICTURE_TYPES = new Set(["image/jpeg", "image/png"]);

type PictureOperation = "upload" | "remove" | "replace" | "reorder";

export async function updatePublicationSku(
  command: PublicationSkuCommand,
): Promise<PublicationManagementResult> {
  const validation = validateSkuCommand(command);

  if ("error" in validation) {
    return badRequest(validation.error);
  }

  return sendJson(validation.path, "PATCH", validation.body);
}

export async function updatePublicationStatus(
  command: PublicationStatusCommand,
): Promise<PublicationManagementResult> {
  if (!isRecord(command) || !isUuid(command.productId)) {
    return badRequest("La publicación no es válida");
  }

  if (command.status !== "active" && command.status !== "paused") {
    return badRequest("El estado no es válido");
  }

  if (command.itemId !== undefined && !isItemId(command.itemId)) {
    return badRequest("El MLA no es válido");
  }

  return sendJson(
    publicationPath(command.productId, "status"),
    "PATCH",
    command.itemId
      ? { status: command.status, itemId: command.itemId }
      : { status: command.status },
  );
}

export async function updatePublicationPictures(
  source: FormData,
): Promise<PublicationManagementResult> {
  const productId = formText(source, "productId");
  const operation = formText(source, "operation") as PictureOperation | null;
  const itemId = formText(source, "itemId");

  if (!productId || !isUuid(productId)) {
    return badRequest("La publicación no es válida");
  }

  if (!operation || !isPictureOperation(operation)) {
    return badRequest("La operación de imágenes no es válida");
  }

  if (itemId !== null && !isItemId(itemId)) {
    return badRequest("El MLA no es válido");
  }

  const validation = validatePictureOperation(source, operation);

  if ("error" in validation) {
    return badRequest(validation.error);
  }

  const body = new FormData();
  body.set("operation", operation);

  if (itemId) {
    body.set("itemId", itemId);
  }

  if (validation.pictureId) {
    body.set("pictureId", validation.pictureId);
  }

  if (validation.pictureIds) {
    body.set("pictureIds", JSON.stringify(validation.pictureIds));
  }

  if (validation.file) {
    body.set("file", validation.file, validation.file.name);
  }

  return sendMultipart(publicationPath(productId, "pictures"), body);
}

function validateSkuCommand(
  command: PublicationSkuCommand,
):
  | Readonly<{ path: string; body: Record<string, string> }>
  | Readonly<{ error: string }> {
  if (!isRecord(command) || !isUuid(command.productId)) {
    return { error: "La publicación no es válida" };
  }

  if (typeof command.sku !== "string") {
    return { error: "El SKU no es válido" };
  }

  const sku = command.sku.trim();

  if (!sku) {
    return { error: "El SKU es obligatorio" };
  }

  if (sku.length > MAX_SKU_LENGTH) {
    return { error: `El SKU admite hasta ${MAX_SKU_LENGTH} caracteres` };
  }

  const path = publicationPath(command.productId, "sku");

  if (command.model === "SHARED") {
    if (command.variationId === undefined) {
      return { path, body: { sku } };
    }

    return isVariationId(command.variationId)
      ? { path, body: { sku, variationId: command.variationId } }
      : { error: "La variación no es válida" };
  }

  if (command.model === "VARIANT_PRICING") {
    return isItemId(command.itemId)
      ? { path, body: { sku, itemId: command.itemId } }
      : { error: "El MLA no es válido" };
  }

  return { error: "El modelo de publicación no es válido" };
}

type ValidatedPictureOperation = Readonly<{
  pictureId?: string;
  pictureIds?: readonly string[];
  file?: File;
}>;

function validatePictureOperation(
  source: FormData,
  operation: PictureOperation,
): ValidatedPictureOperation | Readonly<{ error: string }> {
  const pictureId = formText(source, "pictureId");

  if ((operation === "remove" || operation === "replace") && !isPictureId(pictureId)) {
    return { error: "La imagen seleccionada no es válida" };
  }

  const file = source.get("file");

  if (operation === "upload" || operation === "replace") {
    if (!(file instanceof File) || file.size === 0) {
      return { error: "Seleccioná una imagen" };
    }

    if (!ALLOWED_PICTURE_TYPES.has(file.type)) {
      return { error: "La imagen debe ser JPEG o PNG" };
    }

    if (file.size > MAX_PICTURE_SIZE) {
      return { error: "La imagen no puede superar los 10 MB" };
    }
  }

  if (operation === "reorder") {
    const pictureIds = parsePictureIds(formText(source, "pictureIds"));

    if (!pictureIds || pictureIds.length === 0) {
      return { error: "El orden de imágenes no es válido" };
    }

    return { pictureIds };
  }

  return {
    ...(pictureId ? { pictureId } : {}),
    ...(file instanceof File ? { file } : {}),
  };
}

function parsePictureIds(value: string | null): readonly string[] | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (
      !Array.isArray(parsed) ||
      parsed.length > 50 ||
      parsed.some((id) => !isPictureId(id))
    ) {
      return null;
    }

    const ids = parsed as string[];
    return new Set(ids).size === ids.length ? ids : null;
  } catch {
    return null;
  }
}

async function sendJson(
  path: string,
  method: "PATCH",
  body: Record<string, string>,
): Promise<PublicationManagementResult> {
  return sendRequest(path, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function sendMultipart(
  path: string,
  body: FormData,
): Promise<PublicationManagementResult> {
  return sendRequest(path, {
    method: "POST",
    headers: { Accept: "application/json" },
    body,
  });
}

async function sendRequest(
  path: string,
  init: RequestInit,
): Promise<PublicationManagementResult> {
  const apiUrl = process.env.NEST_API_URL;

  if (!apiUrl) {
    return {
      ok: false,
      status: 500,
      error: "Falta configurar NEST_API_URL",
    };
  }

  try {
    const response = await fetch(new URL(path, apiUrl), {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: await readErrorMessage(response),
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      status: 502,
      error: "No se pudo conectar con el servicio de publicaciones",
    };
  }
}

function publicationPath(productId: string, resource: string) {
  return `/mercadolibre/publicaciones/${encodeURIComponent(productId)}/${resource}`;
}

function badRequest(error: string): PublicationManagementResult {
  return { ok: false, status: 400, error };
}

function formText(source: FormData, name: string) {
  const value = source.get(name);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isItemId(value: unknown): value is string {
  return typeof value === "string" && ITEM_ID_PATTERN.test(value);
}

function isVariationId(value: unknown): value is string {
  return typeof value === "string" && VARIATION_ID_PATTERN.test(value);
}

function isPictureId(value: unknown): value is string {
  return typeof value === "string" && PICTURE_ID_PATTERN.test(value);
}

function isPictureOperation(value: string): value is PictureOperation {
  return ["upload", "remove", "replace", "reorder"].includes(value);
}

async function readErrorMessage(response: Response): Promise<string> {
  const fallback = response.statusText || "No se pudo actualizar";

  try {
    const body = (await response.json()) as unknown;

    if (!isRecord(body)) {
      return fallback;
    }

    const externalCause = Array.isArray(body.cause)
      ? body.cause.find(
          (cause) =>
            isRecord(cause) &&
            typeof cause.message === "string" &&
            cause.message.trim().length > 0,
        )
      : undefined;
    const message =
      body.mercadoLibreMessage ??
      (isRecord(externalCause) ? externalCause.message : undefined) ??
      body.message;

    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }

    if (Array.isArray(message)) {
      const messages = message.filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      );

      if (messages.length > 0) {
        return messages.join(". ");
      }
    }

    return fallback;
  } catch {
    return fallback;
  }
}
