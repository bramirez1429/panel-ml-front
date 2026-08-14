import "server-only";

export function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function asArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

export function firstText(
  source: Record<string, unknown> | null,
  ...keys: readonly string[]
) {
  if (!source) return null;

  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return null;
}

export function firstNumber(
  source: Record<string, unknown> | null,
  ...keys: readonly string[]
) {
  if (!source) return null;

  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }

  return null;
}

export function firstBoolean(
  source: Record<string, unknown> | null,
  ...keys: readonly string[]
) {
  if (!source) return null;

  for (const key of keys) {
    const value = source[key];
    if (typeof value === "boolean") return value;
  }

  return null;
}

