import { EditPublicationAttributes } from "@/components/publicaciones/edit-publication-attributes";
import { EditPublicationText } from "@/components/publicaciones/edit-publication-text";
import { EMPTY_VALUE } from "@/components/publicaciones/publication-display";
import type { PublicationDetail } from "@/types/publication";
import type { PublicationCapabilities } from "@/types/publication-capabilities";

export function PublicationContent({
  publication,
  capabilities,
}: Readonly<{
  publication: PublicationDetail;
  capabilities: PublicationCapabilities | null;
}>) {
  return (
    <section className="grid gap-4 lg:grid-cols-2" aria-label="Contenido de la publicación">
      <article className="rounded-2xl border border-dashboard-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-dashboard-muted">
          Descripción
        </p>
        <div className="mt-3">
          <EditPublicationText
            productId={publication.id}
            field="description"
            value={publication.description}
            editable={capabilities?.description.editable ?? false}
            reason={capabilities?.description.reason}
          />
        </div>
      </article>

      <article className="rounded-2xl border border-dashboard-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-dashboard-muted">
              Atributos comunes
            </p>
            <p className="mt-1 text-xs text-dashboard-muted">
              Solo se envían a Mercado Libre los atributos que declara editables.
            </p>
          </div>
          {capabilities?.attributes.editable &&
          capabilities.editableAttributes.length > 0 ? (
            <EditPublicationAttributes
              productId={publication.id}
              attributes={capabilities.editableAttributes}
            />
          ) : null}
        </div>
        {publication.attributes.length > 0 ? (
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {publication.attributes.map((attribute) => (
              <div key={attribute.id} className="rounded-xl bg-dashboard-control px-3 py-2.5">
                <dt className="text-[0.65rem] font-semibold uppercase tracking-wide text-dashboard-muted">
                  {attribute.id}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-dashboard-foreground">
                  {attribute.value || EMPTY_VALUE}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-4 text-sm text-dashboard-muted">Sin atributos comunes guardados.</p>
        )}
        {!capabilities?.attributes.editable && capabilities?.attributes.reason ? (
          <p className="mt-3 text-xs text-dashboard-muted">{capabilities.attributes.reason}</p>
        ) : null}
      </article>
    </section>
  );
}

