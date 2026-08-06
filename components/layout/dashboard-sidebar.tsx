import { CircleHelp, UserRound } from "lucide-react";
import Link from "next/link";

import { DashboardNavigation } from "@/components/layout/dashboard-navigation";

export function DashboardSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col overflow-hidden border-r border-dashboard-border bg-dashboard-sidebar px-5 py-6 shadow-[0_25px_50px_-12px_var(--dashboard-shadow)] transition-colors lg:flex">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-dashboard-accent to-transparent"
      />

      <Link
        href="/dashboard"
        aria-label="Ir al resumen"
        className="flex items-center gap-3 rounded-xl px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent"
      >
        <div
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-dashboard-accent-border bg-dashboard-accent-soft text-sm font-bold tracking-[0.18em] text-dashboard-accent-foreground shadow-[0_0_24px_var(--dashboard-glow-primary)]"
        >
          ML
        </div>

        <div className="min-w-0">
          <p className="truncate text-base font-semibold tracking-tight text-dashboard-foreground">
            ML Control
          </p>

          <p className="mt-0.5 text-xs text-dashboard-muted">
            Panel operativo
          </p>
        </div>
      </Link>

      <DashboardNavigation />

      <div className="mt-4 border-t border-dashboard-border pt-4">
        <Link
          href="#"
          className="flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium text-dashboard-muted transition-colors hover:bg-dashboard-control hover:text-dashboard-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent"
        >
          <CircleHelp
            aria-hidden="true"
            className="h-5 w-5"
            strokeWidth={1.8}
          />
          <span>Ayuda y soporte</span>
        </Link>

        <div className="mt-2 flex items-center gap-3 rounded-xl border border-dashboard-border bg-dashboard-control px-3 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dashboard-accent-soft text-dashboard-accent-foreground">
            <UserRound
              aria-hidden="true"
              className="h-5 w-5"
              strokeWidth={1.8}
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-dashboard-foreground">
              Bryan
            </p>
            <p className="truncate text-xs text-dashboard-muted">
              Administrador
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}