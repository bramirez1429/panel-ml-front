"use client";

import { LoaderCircle, Pause, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updatePublicationStatus } from "@/app/dashboard/publicaciones/[id]/management-actions";

type EditableStatus = "active" | "paused";

export function PublicationStatusButton({
  productId,
  itemId,
  status,
}: Readonly<{
  productId: string;
  itemId?: string;
  status: string | null;
}>) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<EditableStatus | null>(
    normalizeEditableStatus(status),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!currentStatus) {
    return null;
  }

  const nextStatus: EditableStatus =
    currentStatus === "active" ? "paused" : "active";
  const actionLabel = nextStatus === "paused" ? "Pausar" : "Activar";
  const Icon = nextStatus === "paused" ? Pause : Play;

  function updateStatus() {
    setError(null);
    startTransition(async () => {
      const result = await updatePublicationStatus({
        productId,
        ...(itemId ? { itemId } : {}),
        status: nextStatus,
      });

      if (!result.ok) {
        setError(result.error || `Error ${result.status}`);
        return;
      }

      setCurrentStatus(nextStatus);
      router.refresh();
    });
  }

  return (
    <div className="min-w-0">
      <button
        type="button"
        disabled={pending}
        aria-busy={pending}
        aria-label={`${actionLabel} publicación`}
        title={`${actionLabel} publicación`}
        onClick={updateStatus}
        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-dashboard-border bg-card px-2.5 text-xs font-semibold text-dashboard-foreground transition-colors hover:border-dashboard-accent-border hover:bg-dashboard-control hover:text-dashboard-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? (
          <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Icon aria-hidden="true" className="h-3.5 w-3.5" />
        )}
        {actionLabel}
      </button>
      {error ? (
        <p className="mt-1 max-w-52 break-words text-[0.65rem] leading-snug text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function normalizeEditableStatus(value: string | null): EditableStatus | null {
  const normalized = value?.trim().toLowerCase();
  return normalized === "active" || normalized === "paused"
    ? normalized
    : null;
}
