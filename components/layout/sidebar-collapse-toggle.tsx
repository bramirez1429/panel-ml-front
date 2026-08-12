"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export function SidebarCollapseToggle() {
  const [collapsed, setCollapsed] = useState(false);
  const label = collapsed ? "Abrir menú lateral" : "Cerrar menú lateral";
  const Icon = collapsed ? ChevronRight : ChevronLeft;

  return (
    <button
      type="button"
      data-sidebar-collapsed={collapsed}
      aria-controls="dashboard-sidebar"
      aria-expanded={!collapsed}
      aria-label={label}
      title={label}
      onClick={() => setCollapsed((current) => !current)}
      className="sidebar-collapse-toggle flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dashboard-border bg-dashboard-control text-dashboard-muted transition-[color,background-color,border-color,transform] duration-200 hover:border-dashboard-accent-border hover:bg-dashboard-accent-soft hover:text-dashboard-accent-foreground focus-visible:ring-dashboard-accent"
    >
      <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.9} />
    </button>
  );
}
