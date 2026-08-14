"use client";

import { Check, LoaderCircle, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";

import { updatePublicationAttributes } from "@/app/dashboard/publicaciones/[id]/content-actions";
import type { PublicationEditableAttribute } from "@/types/publication-capabilities";
import type { PublicationAttributeUpdate } from "@/types/publication-content";

export function EditPublicationAttributes({
  productId,
  attributes,
  itemId,
}: Readonly<{
  productId: string;
  attributes: readonly PublicationEditableAttribute[];
  itemId?: string;
}>) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      attributes.map((attribute) => [attribute.id, initialValue(attribute)]),
    ),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setDraft(
      Object.fromEntries(
        attributes.map((attribute) => [attribute.id, initialValue(attribute)]),
      ),
    );
    setError(null);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const updates = attributes.flatMap<PublicationAttributeUpdate>((attribute) => {
      const rawValue = draft[attribute.id]?.trim();
      if (!rawValue) {
        const hadValue = Boolean(attribute.valueId || attribute.value);
        return !attribute.required && hadValue
          ? [{ id: attribute.id, valueId: null, valueName: null }]
          : [];
      }
      const allowed = attribute.allowedValues.find(
        (value) => value.id === rawValue || value.name === rawValue,
      );
      return [
        {
          id: attribute.id,
          ...(allowed ? { valueId: allowed.id } : { valueName: rawValue }),
        },
      ];
    });

    const missing = attributes.find(
      (attribute) => attribute.required && !draft[attribute.id]?.trim(),
    );
    if (missing) {
      setError(`Completá ${missing.name}`);
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updatePublicationAttributes(productId, updates, itemId);
      if (!result.ok) {
        setError(result.error || `Error ${result.status}`);
        return;
      }

      setEditing(false);
      router.refresh();
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          reset();
          setEditing(true);
        }}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-dashboard-border bg-card px-3 text-xs font-semibold text-dashboard-foreground transition-colors hover:border-dashboard-accent-border hover:bg-dashboard-control"
      >
        <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
        Editar atributos permitidos
      </button>
    );
  }

  return (
    <form onSubmit={submit} aria-busy={pending} className="mt-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {attributes.map((attribute) => (
          <label key={attribute.id} className="text-xs font-semibold text-dashboard-foreground">
            {attribute.name}
            {attribute.required ? " *" : ""}
            {attribute.allowedValues.length > 0 &&
            !attribute.allowCustomValue ? (
              <select
                value={draft[attribute.id] ?? ""}
                disabled={pending}
                required={attribute.required}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, [attribute.id]: event.target.value }))
                }
                className="mt-1.5 h-10 w-full rounded-lg border border-dashboard-border bg-card px-2 text-sm font-normal"
              >
                <option value="">Seleccionar</option>
                {attribute.allowedValues.map((value) => (
                  <option key={value.id} value={value.id}>
                    {value.name}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input
                  type="text"
                  list={
                    attribute.allowedValues.length > 0
                      ? `editable-${attribute.id}`
                      : undefined
                  }
                  value={draft[attribute.id] ?? ""}
                  disabled={pending}
                  required={attribute.required}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, [attribute.id]: event.target.value }))
                  }
                  className="mt-1.5 h-10 w-full rounded-lg border border-dashboard-border bg-card px-3 text-sm font-normal"
                />
                {attribute.allowedValues.length > 0 ? (
                  <datalist id={`editable-${attribute.id}`}>
                    {attribute.allowedValues.map((value) => (
                      <option key={value.id} value={value.name} />
                    ))}
                  </datalist>
                ) : null}
              </>
            )}
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            reset();
            setEditing(false);
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashboard-border px-3 text-xs font-semibold"
        >
          <X aria-hidden="true" className="h-3.5 w-3.5" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-dashboard-accent px-3 text-xs font-semibold text-white disabled:opacity-60"
        >
          {pending ? (
            <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check aria-hidden="true" className="h-3.5 w-3.5" />
          )}
          Guardar
        </button>
      </div>
      {error ? <p className="text-xs text-red-600" role="alert">{error}</p> : null}
    </form>
  );
}

function initialValue(attribute: PublicationEditableAttribute) {
  if (
    attribute.allowedValues.length === 0 ||
    attribute.allowCustomValue
  ) {
    return attribute.value ?? "";
  }

  return (
    attribute.valueId ??
    attribute.allowedValues.find((value) => value.name === attribute.value)?.id ??
    ""
  );
}
