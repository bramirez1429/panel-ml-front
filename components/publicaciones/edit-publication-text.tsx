"use client";

import { Check, LoaderCircle, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";

import {
  updatePublicationDescription,
  updatePublicationTitle,
} from "@/app/dashboard/publicaciones/[id]/content-actions";
import { EMPTY_VALUE } from "@/components/publicaciones/publication-display";

export function EditPublicationText({
  productId,
  field,
  value,
  editable,
  reason,
  itemId,
  prominent = false,
}: Readonly<{
  productId: string;
  field: "title" | "description";
  value: string | null;
  editable: boolean;
  reason?: string | null;
  itemId?: string;
  prominent?: boolean;
}>) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const label = field === "title" ? "título" : "descripción";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (field === "title" && !draft.trim()) {
      setError("Ingresá un título");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result =
        field === "title"
          ? await updatePublicationTitle(productId, draft, itemId)
          : await updatePublicationDescription(productId, draft, itemId);

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
      <div className="min-w-0">
        <div className="flex min-w-0 items-start gap-2">
          {field === "description" ? (
            <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm leading-6 text-dashboard-foreground">
              {value || EMPTY_VALUE}
            </p>
          ) : (
            <span
              className={`min-w-0 flex-1 ${prominent ? "text-2xl font-semibold leading-tight tracking-tight sm:text-3xl" : "font-semibold"}`}
            >
              {value || EMPTY_VALUE}
            </span>
          )}
          {editable ? (
            <button
              type="button"
              aria-label={`Editar ${label}`}
              title={`Editar ${label}`}
              onClick={() => {
                setDraft(value ?? "");
                setError(null);
                setEditing(true);
              }}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-dashboard-muted transition-colors hover:bg-dashboard-accent-soft hover:text-dashboard-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent"
            >
              <Pencil aria-hidden="true" className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        {!editable && reason ? (
          <p className="mt-1 text-xs text-dashboard-muted">{reason}</p>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={submit} aria-busy={pending} className="min-w-0">
      {field === "description" ? (
        <textarea
          autoFocus
          value={draft}
          disabled={pending}
          rows={7}
          onChange={(event) => setDraft(event.target.value)}
          aria-label="Descripción"
          className="w-full resize-y rounded-xl border border-dashboard-accent-border bg-card px-3 py-2.5 text-sm leading-6 text-dashboard-foreground outline-none focus:ring-2 focus:ring-dashboard-accent"
        />
      ) : (
        <input
          autoFocus
          required
          type="text"
          value={draft}
          disabled={pending}
          onChange={(event) => setDraft(event.target.value)}
          aria-label="Título"
          className="h-11 w-full rounded-xl border border-dashboard-accent-border bg-card px-3 text-base font-semibold text-dashboard-foreground outline-none focus:ring-2 focus:ring-dashboard-accent"
        />
      )}
      <div className="mt-2 flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setDraft(value ?? "");
            setError(null);
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
      {error ? (
        <p className="mt-2 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
