import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import { PublicationList } from "@/components/publicaciones/publication-list";
import { PublicationPagination } from "@/components/publicaciones/publication-pagination";
import { getPublications } from "@/lib/api/publications";

const PAGE_SIZE = 20;

export const metadata: Metadata = {
  title: "Publicaciones | ML Control",
};

type PublicacionesPageProps = Readonly<{
  searchParams: Promise<{
    page?: string | string[];
  }>;
}>;

function parsePage(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number(rawValue);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export default async function PublicacionesPage({
  searchParams,
}: PublicacionesPageProps) {
  const query = await searchParams;
  const page = parsePage(query.page);
  const result = await getPublications({ page, limit: PAGE_SIZE });

  if (
    page > 1 &&
    (result.paging.totalPages === 0 || page > result.paging.totalPages)
  ) {
    redirect(
      `/dashboard/publicaciones?page=${Math.max(result.paging.totalPages, 1)}`,
    );
  }

  const total = new Intl.NumberFormat("es-AR").format(result.paging.total);

  return (
    <section className="w-full min-w-0 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dashboard-accent-foreground">
            Catálogo
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-dashboard-foreground sm:text-3xl">
            Publicaciones
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-dashboard-muted">
            {total} productos agrupados, con sus variantes dentro de una única publicación.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-dashboard-muted">
            Página{" "}
            <span className="font-semibold text-dashboard-foreground">
              {result.paging.page}
            </span>{" "}
            de {Math.max(result.paging.totalPages, 1)}
          </p>
          <Link
            href="/dashboard/publicaciones/nueva"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-dashboard-accent px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Nueva publicación
          </Link>
        </div>
      </header>

      <PublicationList publications={result.publications} />
      <PublicationPagination paging={result.paging} />
    </section>
  );
}
