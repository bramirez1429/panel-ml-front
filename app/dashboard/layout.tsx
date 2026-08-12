import type { ReactNode } from "react";

import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardTopbar } from "@/components/layout/dashboard-topbar";

type DashboardLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className="dashboard-shell relative min-h-screen w-full overflow-x-clip bg-dashboard-background font-sans text-dashboard-foreground transition-colors duration-200">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,var(--dashboard-glow-secondary),transparent_30%),radial-gradient(circle_at_bottom_left,var(--dashboard-glow-primary),transparent_26%)]"
      />

      <DashboardSidebar />

      <div className="dashboard-content relative flex min-h-screen min-w-0 flex-col transition-[padding-left] duration-200 lg:pl-60">
        <DashboardTopbar />

        <main className="mx-auto flex w-full max-w-[1600px] flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
