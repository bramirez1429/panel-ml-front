import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { NewPublicationForm } from "@/components/publicaciones/new-publication-form";

export const metadata: Metadata = {
  title: "Nueva publicación | ML Control",
};

export default function NewPublicationPage() {
  return (
    <section className="w-full min-w-0 space-y-6">
      <Link
        href="/dashboard/publicaciones"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-dashboard-muted hover:text-dashboard-foreground"
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        Volver a publicaciones
      </Link>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dashboard-accent-foreground">
          Mercado Libre
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-dashboard-foreground sm:text-3xl">
          Nueva publicación
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-dashboard-muted">
          Completá el esquema dinámico de la categoría. El backend valida el borrador en Mercado Libre antes de habilitar la publicación real.
        </p>
      </header>
      <NewPublicationForm />
    </section>
  );
}

