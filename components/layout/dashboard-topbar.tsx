import { ThemeToggle } from "@/components/layout/theme-toggle";

export function DashboardTopbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-dashboard-border bg-dashboard-topbar backdrop-blur-xl transition-colors">
      <div className="mx-auto flex min-h-24 w-full max-w-[1600px] flex-col gap-4 px-4 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between lg:px-8">
        <div className="min-w-0">
          <p className="truncate text-xl font-semibold tracking-tight text-dashboard-foreground sm:text-2xl">
            Panel de control
          </p>
          <p className="mt-1 text-sm text-dashboard-muted">
            Administrá tu negocio desde un solo lugar
          </p>
        </div>

        <div className="flex min-w-0 w-full flex-col gap-3 sm:flex-row sm:items-center xl:w-auto">
          <label className="block min-w-0 flex-1 md:w-72 md:flex-none xl:w-80">
            <span className="sr-only">
              Buscador visual, disponible próximamente
            </span>
            <input
              type="search"
              disabled
              placeholder="Buscar en el panel..."
              className="h-11 w-full cursor-not-allowed rounded-xl border border-dashboard-border bg-dashboard-control px-4 text-sm text-dashboard-foreground outline-none placeholder:text-dashboard-muted disabled:opacity-100"
            />
          </label>

          <div className="flex min-w-0 items-center gap-3">
            <ThemeToggle />

            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-dashboard-success-border bg-dashboard-success-soft px-3 py-2">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full bg-dashboard-success shadow-[0_0_12px_var(--dashboard-success)]"
              />
              <span className="truncate text-xs font-medium text-dashboard-success-foreground">
                Mercado Libre conectado
              </span>
            </div>

            <div
              role="img"
              aria-label="Avatar de BR"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dashboard-accent-border bg-dashboard-accent-soft text-xs font-bold tracking-wider text-dashboard-accent-foreground"
            >
              BR
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
