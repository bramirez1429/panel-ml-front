import "server-only";

export type ApiActionResult<T = null> =
  | Readonly<{ ok: true; data: T }>
  | Readonly<{ ok: false; status: number; error: string }>;

export async function apiAction<T = null>(
  path: string,
  init: RequestInit,
  timeoutMs = 60_000,
): Promise<ApiActionResult<T>> {
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
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: await readErrorMessage(response),
      };
    }

    if (response.status === 204) {
      return { ok: true, data: null as T };
    }

    const contentType = response.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json")
      ? ((await response.json()) as T)
      : (null as T);

    return { ok: true, data };
  } catch {
    return {
      ok: false,
      status: 502,
      error: "No se pudo conectar con el servicio de publicaciones",
    };
  }
}

async function readErrorMessage(response: Response) {
  const fallback = response.statusText || "No se pudo completar la operación";

  try {
    const body = (await response.json()) as unknown;

    if (!isRecord(body)) return fallback;

    const externalCause = Array.isArray(body.cause)
      ? body.cause.find(
          (cause) =>
            isRecord(cause) &&
            typeof cause.message === "string" &&
            cause.message.trim(),
        )
      : null;
    const message =
      body.mercadoLibreMessage ??
      (isRecord(externalCause) ? externalCause.message : null) ??
      body.message;

    if (typeof message === "string" && message.trim()) return message.trim();
    if (Array.isArray(message)) {
      const messages = message.filter(
        (value): value is string =>
          typeof value === "string" && Boolean(value.trim()),
      );
      if (messages.length > 0) return messages.join(". ");
    }

    return fallback;
  } catch {
    return fallback;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

