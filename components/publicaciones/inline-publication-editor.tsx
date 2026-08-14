"use client";

import { Check, LoaderCircle, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";

import { updatePublication } from "@/app/dashboard/publicaciones/[id]/actions";
import {
  EMPTY_VALUE,
  formatInteger,
  formatMoney,
} from "@/components/publicaciones/publication-display";
import type { PublicationEditCommand } from "@/types/publication-edit";

type EditorIdentity =
  | Readonly<{
      model: "SHARED";
      field: "price";
    }>
  | Readonly<{
      model: "SHARED";
      field: "stock";
      variationId?: string;
    }>
  | Readonly<{
      model: "VARIANT_PRICING";
      field: "price" | "stock";
      itemId: string;
    }>;

type InlinePublicationEditorProps = Readonly<{
  productId: string;
  value: number | null;
  currencyId?: string | null;
  label: string;
  prominent?: boolean;
}> &
  EditorIdentity;

export function InlinePublicationEditor({
  productId,
  value,
  currencyId = null,
  label,
  prominent = false,
  ...identity
}: InlinePublicationEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value === null ? "" : String(value));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isPrice = identity.field === "price";
  const formattedValue = isPrice
    ? formatMoney(value, currencyId)
    : formatInteger(value);

  function cancel() {
    setDraft(value === null ? "" : String(value));
    setError(null);
    setEditing(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) {
      setError(isPrice ? "Ingresá un precio" : "Ingresá el stock");
      return;
    }

    const nextValue = Number(draft);

    if (
      !Number.isFinite(nextValue) ||
      (isPrice ? nextValue <= 0 : !Number.isInteger(nextValue) || nextValue < 0)
    ) {
      setError(
        isPrice
          ? "Ingresá un precio mayor a 0"
          : "Ingresá un stock entero mayor o igual a 0",
      );
      return;
    }

    const command = createCommand(productId, identity, nextValue);
    setError(null);

    startTransition(async () => {
      const result = await updatePublication(command);

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
      <div className="flex min-w-0 items-center gap-1.5">
        <span
          className={`min-w-0 truncate ${prominent ? "text-2xl font-semibold tracking-tight" : "font-semibold"}`}
          title={formattedValue === EMPTY_VALUE ? undefined : formattedValue}
        >
          {formattedValue}
        </span>
        <button
          type="button"
          aria-label={`Editar ${label}`}
          title={`Editar ${label}`}
          onClick={() => {
            setDraft(value === null ? "" : String(value));
            setError(null);
            setEditing(true);
          }}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-dashboard-muted transition-colors hover:bg-dashboard-accent-soft hover:text-dashboard-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent"
        >
          <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="min-w-0" aria-busy={pending}>
      <div className="flex min-w-0 items-center gap-1">
        <input
          type="number"
          name={identity.field}
          aria-label={label}
          autoFocus
          required
          min={isPrice ? "0.01" : "0"}
          step={isPrice ? "0.01" : "1"}
          inputMode={isPrice ? "decimal" : "numeric"}
          value={draft}
          disabled={pending}
          onChange={(event) => setDraft(event.target.value)}
          className={`min-w-0 rounded-md border border-dashboard-accent-border bg-card px-2 text-dashboard-foreground outline-none transition-shadow focus:ring-2 focus:ring-dashboard-accent ${
            prominent ? "h-10 w-40 text-lg font-semibold" : "h-8 w-full text-xs"
          }`}
        />
        <button
          type="submit"
          aria-label={`Guardar ${label}`}
          title={`Guardar ${label}`}
          disabled={pending}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-dashboard-accent-soft text-dashboard-accent-foreground transition-colors hover:bg-dashboard-control disabled:opacity-50"
        >
          {pending ? (
            <LoaderCircle
              aria-hidden="true"
              className="h-4 w-4 animate-spin"
            />
          ) : (
            <Check aria-hidden="true" className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          aria-label="Cancelar edición"
          title="Cancelar"
          disabled={pending}
          onClick={cancel}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-dashboard-muted transition-colors hover:bg-dashboard-control hover:text-dashboard-foreground disabled:opacity-50"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      {error ? (
        <p className="mt-1 max-w-64 break-words text-[0.65rem] leading-snug text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function createCommand(
  productId: string,
  identity: EditorIdentity,
  value: number,
): PublicationEditCommand {
  if (identity.model === "SHARED") {
    return identity.field === "price"
      ? { kind: "shared-price", productId, price: value }
      : {
          kind: "shared-stock",
          productId,
          ...(identity.variationId
            ? { variationId: identity.variationId }
            : {}),
          stock: value,
        };
  }

  return identity.field === "price"
    ? {
        kind: "variant-price",
        productId,
        itemId: identity.itemId,
        price: value,
      }
    : {
        kind: "variant-stock",
        productId,
        itemId: identity.itemId,
        stock: value,
      };
}
