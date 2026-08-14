import { AlertCircle, CheckCircle2, History } from "lucide-react";

import type { PublicationAction } from "@/types/publication-activity";

const ACTION_LABELS: Record<string, string> = {
  PRICE_UPDATED: "Precio actualizado",
  STOCK_UPDATED: "Stock actualizado",
  SKU_UPDATED: "SKU actualizado",
  PICTURES_UPDATED: "Imágenes actualizadas",
  PAUSED: "Publicación pausada",
  ACTIVATED: "Publicación activada",
  TITLE_UPDATED: "Título actualizado",
  DESCRIPTION_UPDATED: "Descripción actualizada",
  ATTRIBUTES_UPDATED: "Atributos actualizados",
  PROMOTION_APPLIED: "Promoción aplicada",
  PROMOTION_REMOVED: "Promoción removida",
  PUBLISHED: "Publicación creada",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function PublicationActivity({
  actions,
}: Readonly<{ actions: readonly PublicationAction[] }>) {
  return (
    <section className="rounded-2xl border border-dashboard-border bg-card p-5 sm:p-6" aria-labelledby="activity-heading">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-dashboard-control text-dashboard-muted">
          <History aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-dashboard-muted">Auditoría</p>
          <h2 id="activity-heading" className="mt-1 text-lg font-semibold text-dashboard-foreground">Actividad reciente</h2>
        </div>
      </div>

      {actions.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-dashboard-border px-4 py-8 text-center text-sm text-dashboard-muted">
          Todavía no hay acciones registradas desde el panel.
        </p>
      ) : (
        <ol className="mt-5 divide-y divide-dashboard-border">
          {actions.map((action) => {
            const success = action.status === "SUCCESS";
            const Icon = success ? CheckCircle2 : AlertCircle;
            return (
              <li key={action.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <Icon
                  aria-hidden="true"
                  className={`mt-0.5 h-4 w-4 shrink-0 ${success ? "text-emerald-600" : "text-red-600"}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-dashboard-foreground">
                      {ACTION_LABELS[action.action] ?? action.action.replaceAll("_", " ")}
                    </p>
                    <time className="text-xs text-dashboard-muted" dateTime={action.createdAt}>
                      {formatDate(action.createdAt)}
                    </time>
                  </div>
                  {action.itemId ? <p className="mt-1 font-mono text-xs text-dashboard-muted">{action.itemId}</p> : null}
                  {action.errorMessage ? <p className="mt-1 text-xs text-red-600">{action.errorMessage}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

