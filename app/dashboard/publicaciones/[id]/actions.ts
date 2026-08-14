"use server";

import type {
  PublicationEditCommand,
  PublicationEditResult,
} from "@/types/publication-edit";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ValidatedRequest = Readonly<{
  path: string;
  body: Record<string, number | string>;
}>;

export async function updatePublication(
  command: PublicationEditCommand,
): Promise<PublicationEditResult> {
  const validation = validateCommand(command);

  if ("error" in validation) {
    return { ok: false, status: 400, error: validation.error };
  }

  const apiUrl = process.env.NEST_API_URL;

  if (!apiUrl) {
    return {
      ok: false,
      status: 500,
      error: "Falta configurar NEST_API_URL",
    };
  }

  try {
    const response = await fetch(new URL(validation.path, apiUrl), {
      method: "PATCH",
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validation.body),
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

function validateCommand(
  command: PublicationEditCommand,
): ValidatedRequest | Readonly<{ error: string }> {
  if (!isRecord(command) || !isUuid(command.productId)) {
    return { error: "La publicación no es válida" };
  }

  const basePath = `/mercadolibre/publicaciones/${encodeURIComponent(command.productId)}`;

  switch (command.kind) {
    case "shared-price":
      return isPrice(command.price)
        ? { path: `${basePath}/precio`, body: { price: command.price } }
        : { error: "El precio debe ser mayor a 0" };
    case "shared-stock":
      if (
        command.variationId !== undefined &&
        !isVariationId(command.variationId)
      ) {
        return { error: "La variación no es válida" };
      }

      return isStock(command.stock)
        ? {
            path: `${basePath}/stock`,
            body: {
              stock: command.stock,
              ...(command.variationId
                ? { variationId: command.variationId }
                : {}),
            },
          }
        : { error: "El stock debe ser un entero mayor o igual a 0" };
    case "variant-price":
      if (!isItemId(command.itemId)) {
        return { error: "El MLA no es válido" };
      }

      return isPrice(command.price)
        ? {
            path: `${basePath}/precio`,
            body: { price: command.price, itemId: command.itemId },
          }
        : { error: "El precio debe ser mayor a 0" };
    case "variant-stock":
      if (!isItemId(command.itemId)) {
        return { error: "El MLA no es válido" };
      }

      return isStock(command.stock)
        ? {
            path: `${basePath}/stock`,
            body: { stock: command.stock, itemId: command.itemId },
          }
        : { error: "El stock debe ser un entero mayor o igual a 0" };
    default:
      return { error: "La actualización no es válida" };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isItemId(value: unknown): value is string {
  return typeof value === "string" && /^MLA\d+$/.test(value);
}

function isVariationId(value: unknown): value is string {
  return typeof value === "string" && /^\d+$/.test(value);
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

function isPrice(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isStock(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === "number" && value >= 0;
}
