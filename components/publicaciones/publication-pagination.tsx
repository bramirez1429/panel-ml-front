import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import type { PublicationsPaging } from "@/types/publication";

const buttonBaseClassName =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] border border-dashboard-border bg-card px-3 text-sm font-medium text-dashboard-foreground";
const buttonClassName = `${buttonBaseClassName} transition-colors hover:border-dashboard-accent-border hover:bg-dashboard-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent`;
const disabledButtonClassName = `${buttonBaseClassName} cursor-not-allowed opacity-40`;

function pageHref(page: number) {
  return {
    pathname: "/dashboard/publicaciones",
    query: { page },
  };
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const pages = new Set([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);
  const visible = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
  const items: (number | string)[] = [];

  visible.forEach((page, index) => {
    const previous = visible[index - 1];

    if (previous && page - previous > 1) {
      items.push(`ellipsis-${previous}`);
    }

    items.push(page);
  });

  return items;
}

export function PublicationPagination({
  paging,
}: Readonly<{ paging: PublicationsPaging }>) {
  if (paging.totalPages <= 1) {
    return null;
  }

  const currentPage = Math.min(
    Math.max(paging.page, 1),
    paging.totalPages,
  );
  const pages = getVisiblePages(currentPage, paging.totalPages);

  return (
    <nav
      aria-label="Paginación de publicaciones"
      className="grid grid-cols-2 items-center gap-3 pt-2 sm:flex sm:flex-wrap sm:justify-between"
    >
      {currentPage > 1 ? (
        <Link
          href={pageHref(currentPage - 1)}
          prefetch={false}
          className={`${buttonClassName} justify-self-start`}
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          Anterior
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={`${disabledButtonClassName} justify-self-start`}
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          Anterior
        </span>
      )}

      <span className="col-span-2 row-start-1 text-center text-sm text-dashboard-muted sm:hidden">
        Página <strong className="text-dashboard-foreground">{currentPage}</strong> de{" "}
        {paging.totalPages}
      </span>

      <div className="hidden items-center gap-1.5 sm:flex">
        {pages.map((item) =>
          typeof item === "string" ? (
            <span key={item} className="px-1 text-dashboard-muted" aria-hidden="true">
              …
            </span>
          ) : item === currentPage ? (
            <span
              key={item}
              aria-current="page"
              className="inline-flex h-10 min-w-10 items-center justify-center rounded-[10px] border border-dashboard-accent-border bg-dashboard-accent-soft px-3 text-sm font-semibold text-dashboard-accent-foreground"
            >
              {item}
            </span>
          ) : (
            <Link
              key={item}
              href={pageHref(item)}
              prefetch={false}
              aria-label={`Ir a la página ${item}`}
              className="inline-flex h-10 min-w-10 items-center justify-center rounded-[10px] border border-dashboard-border bg-card px-3 text-sm font-semibold text-dashboard-muted transition-colors hover:border-dashboard-accent-border hover:bg-dashboard-control hover:text-dashboard-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent"
            >
              {item}
            </Link>
          ),
        )}
      </div>

      {currentPage < paging.totalPages ? (
        <Link
          href={pageHref(currentPage + 1)}
          prefetch={false}
          className={`${buttonClassName} justify-self-end`}
        >
          Siguiente
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={`${disabledButtonClassName} justify-self-end`}
        >
          Siguiente
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
