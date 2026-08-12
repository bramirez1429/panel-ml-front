import "server-only";

type QueryValue = string | number | boolean | undefined;

type ApiGetOptions = Readonly<{
  params?: Record<string, QueryValue>;
}>;

const API_URL = process.env.NEST_API_URL;

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export async function apiGet<T>(
  path: string,
  options: ApiGetOptions = {},
): Promise<T> {
  if (!API_URL) {
    throw new Error("Falta configurar NEST_API_URL");
  }

  const url = new URL(path, API_URL);

  for (const [key, value] of Object.entries(options.params ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new ApiRequestError(
      `Error consultando ${path}: ${response.status}`,
      response.status,
    );
  }

  return response.json() as Promise<T>;
}
