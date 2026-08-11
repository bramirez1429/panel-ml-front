import { PackageSearch } from "lucide-react";

import { PublicationCard } from "@/components/publicaciones/publication-card";
import type { Publication } from "@/types/publication";

export function PublicationList({
  publications,
}: Readonly<{ publications: readonly Publication[] }>) {
  if (publications.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-dashboard-border bg-card px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-dashboard-control text-dashboard-muted">
          <PackageSearch aria-hidden="true" className="h-6 w-6" strokeWidth={1.6} />
        </div>
        <h2 className="mt-4 text-base font-semibold text-dashboard-foreground">
          No hay publicaciones en esta página
        </h2>
        <p className="mt-1 max-w-sm text-sm text-dashboard-muted">
          Probá volver a una página anterior del listado.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-4" aria-label="Listado de publicaciones">
      {publications.map((publication) => (
        <li key={publication.id}>
          <PublicationCard publication={publication} />
        </li>
      ))}
    </ul>
  );
}
