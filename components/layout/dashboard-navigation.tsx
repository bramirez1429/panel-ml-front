"use client";

import {
  BadgeDollarSign,
  Boxes,
  LayoutDashboard,
  Megaphone,
  PackageSearch,
  Plug,
  Settings,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationItem = Readonly<{
  label: string;
  href: string;
  icon: LucideIcon;
}>;

const primaryNavigation: readonly NavigationItem[] = [
  {
    label: "Resumen",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Publicaciones",
    href: "/dashboard/publicaciones",
    icon: PackageSearch,
  },
  {
    label: "Precios y promociones",
    href: "/dashboard/precios-promociones",
    icon: BadgeDollarSign,
  },
  {
    label: "Stock",
    href: "/dashboard/stock",
    icon: Boxes,
  },
  {
    label: "Ventas",
    href: "/dashboard/ventas",
    icon: ShoppingCart,
  },
  {
    label: "Publicidad",
    href: "/dashboard/publicidad",
    icon: Megaphone,
  },
];

const secondaryNavigation: readonly NavigationItem[] = [
  {
    label: "Integraciones",
    href: "/dashboard/integraciones",
    icon: Plug,
  },
  {
    label: "Configuración",
    href: "/dashboard/configuracion",
    icon: Settings,
  },
];

const navigationLinkBase =
  "group flex min-h-11 w-full items-center gap-3 rounded-[10px] border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent";

function NavigationLinks({
  items,
  pathname,
}: Readonly<{
  items: readonly NavigationItem[];
  pathname: string;
}>) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => {
        const Icon = item.icon;

        const isActive =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`${navigationLinkBase} ${
                isActive
                  ? "border-dashboard-accent-border bg-dashboard-accent-soft text-dashboard-accent-foreground shadow-[inset_2px_0_0_var(--dashboard-accent)]"
                  : "border-transparent text-dashboard-muted hover:border-dashboard-border hover:bg-dashboard-control hover:text-dashboard-foreground"
              }`}
            >
              <Icon
                aria-hidden="true"
                className="h-5 w-5 shrink-0"
                strokeWidth={1.8}
              />

              <span className="truncate">{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function DashboardNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="dashboard-scrollbar mt-8 -mr-5 min-h-0 flex-1 overflow-y-auto pr-2"
    >
      <p className="px-3.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-dashboard-muted">
        Gestión
      </p>

      <div className="mt-3">
        <NavigationLinks
          items={primaryNavigation}
          pathname={pathname}
        />
      </div>

      <div className="my-6 h-px bg-gradient-to-r from-transparent via-dashboard-border to-transparent" />

      <p className="px-3.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-dashboard-muted">
        Sistema
      </p>

      <div className="mt-3 pb-4">
        <NavigationLinks
          items={secondaryNavigation}
          pathname={pathname}
        />
      </div>
    </nav>
  );
}