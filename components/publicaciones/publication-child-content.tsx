import { EditPublicationAttributes } from "@/components/publicaciones/edit-publication-attributes";
import { EditPublicationText } from "@/components/publicaciones/edit-publication-text";
import type { PublicationCapabilities } from "@/types/publication-capabilities";

export function PublicationChildContent({
  productId,
  itemId,
  capabilities,
}: Readonly<{
  productId: string;
  itemId: string;
  capabilities: PublicationCapabilities | null;
}>) {
  if (!capabilities) return null;

  return (
    <details className="w-full rounded-lg border border-dashboard-border bg-card px-3 py-2 text-xs">
      <summary className="cursor-pointer font-semibold text-dashboard-foreground">
        Título, descripción y atributos de {itemId}
      </summary>
      <div className="mt-3 grid gap-4 border-t border-dashboard-border pt-3 lg:grid-cols-3">
        <div>
          <p className="mb-2 font-semibold uppercase tracking-wide text-dashboard-muted">
            Título
          </p>
          <EditPublicationText
            productId={productId}
            itemId={itemId}
            field="title"
            value={capabilities.currentContent.title}
            editable={capabilities.title.editable}
            reason={capabilities.title.reason}
          />
        </div>
        <div>
          <p className="mb-2 font-semibold uppercase tracking-wide text-dashboard-muted">
            Descripción
          </p>
          <EditPublicationText
            productId={productId}
            itemId={itemId}
            field="description"
            value={capabilities.currentContent.description}
            editable={capabilities.description.editable}
            reason={capabilities.description.reason}
          />
        </div>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold uppercase tracking-wide text-dashboard-muted">
              Atributos editables
            </p>
            {capabilities.attributes.editable &&
            capabilities.editableAttributes.length > 0 ? (
              <EditPublicationAttributes
                productId={productId}
                itemId={itemId}
                attributes={capabilities.editableAttributes}
              />
            ) : null}
          </div>
          {!capabilities.attributes.editable && capabilities.attributes.reason ? (
            <p className="mt-2 text-dashboard-muted">
              {capabilities.attributes.reason}
            </p>
          ) : null}
        </div>
      </div>
    </details>
  );
}
