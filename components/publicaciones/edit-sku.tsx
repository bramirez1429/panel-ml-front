"use client";

import { Check, LoaderCircle, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";

import { updatePublicationSku } from "@/app/dashboard/publicaciones/[id]/management-actions";
import { EMPTY_VALUE } from "@/components/publicaciones/publication-display";
import type { PublicationSkuCommand } from "@/types/publication-management";

type SkuIdentity =
  | Readonly<{
      model: "SHARED";
      variationId?: string;
    }>
  | Readonly<{
      model: "VARIANT_PRICING";
      itemId: string;
    }>;

type EditSkuProps = Readonly<{
  productId: string;
  value: string | null;
  label: string;
}> &
  SkuIdentity;

export function EditSku({
  productId,
  value,
  label,
  ...identity
}: EditSkuProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const shownValue = value || EMPTY_VALUE;

  function cancel() {
    setDraft(value ?? "");
    setError(null);
    setEditing(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sku = draft.trim();

    if (!sku) {
      setError("Ingresá un SKU");
      return;
    }

    if (sku.length > 64) {
      setError("El SKU admite hasta 64 caracteres");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await updatePublicationSku(
        createSkuCommand(productId, identity, sku),
      );

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
          className="min-w-0 truncate font-mono text-[0.7rem] font-semibold"
          title={value ?? undefined}
        >
          {shownValue}
        </span>
        <button
          type="button"
          aria-label={`Editar ${label}`}
          title={`Editar ${label}`}
          onClick={() => {
            setDraft(value ?? "");
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
          type="text"
          name="sku"
          aria-label={label}
          autoFocus
          maxLength={64}
          value={draft}
          disabled={pending}
          onChange={(event) => setDraft(event.target.value)}
          className="h-8 min-w-0 w-full rounded-md border border-dashboard-accent-border bg-card px-2 font-mono text-xs text-dashboard-foreground outline-none transition-shadow focus:ring-2 focus:ring-dashboard-accent"
        />
        <button
          type="submit"
          aria-label={`Guardar ${label}`}
          title={`Guardar ${label}`}
          disabled={pending}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-dashboard-accent-soft text-dashboard-accent-foreground transition-colors hover:bg-dashboard-control disabled:opacity-50"
        >
          {pending ? (
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
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

function createSkuCommand(
  productId: string,
  identity: SkuIdentity,
  sku: string,
): PublicationSkuCommand {
  return identity.model === "SHARED"
    ? {
        model: "SHARED",
        productId,
        ...(identity.variationId
          ? { variationId: identity.variationId }
          : {}),
        sku,
      }
    : {
        model: "VARIANT_PRICING",
        productId,
        itemId: identity.itemId,
        sku,
      };
}
