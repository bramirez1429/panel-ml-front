"use client";

import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  LoaderCircle,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";

import { updatePublicationPictures } from "@/app/dashboard/publicaciones/[id]/management-actions";
import type { PublicationPicture } from "@/types/publication";

const MAX_PICTURE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);

type PictureOperation = "upload" | "remove" | "replace" | "reorder";

export function PictureManager({
  productId,
  itemId,
  pictures,
  title,
  compact = false,
}: Readonly<{
  productId: string;
  itemId?: string;
  pictures: readonly PublicationPicture[];
  title: string;
  compact?: boolean;
}>) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const [orderedPictures, setOrderedPictures] = useState([...pictures]);
  const [orderDirty, setOrderDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const visiblePictures = pictures.slice(0, compact ? 2 : 3);

  function baseData(operation: PictureOperation) {
    const data = new FormData();
    data.set("productId", productId);
    data.set("operation", operation);

    if (itemId) {
      data.set("itemId", itemId);
    }

    return data;
  }

  function runMutation(data: FormData, onSuccess?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await updatePublicationPictures(data);

      if (!result.ok) {
        setError(result.error || `Error ${result.status}`);
        return;
      }

      onSuccess?.();
      router.refresh();
    });
  }

  function submitUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("file");
    const file = input instanceof HTMLInputElement ? input.files?.[0] : null;
    const fileError = validateFile(file);

    if (fileError || !file) {
      setError(fileError ?? "Seleccioná una imagen");
      return;
    }

    const data = baseData("upload");
    data.set("file", file, file.name);
    runMutation(data, () => {
      form.reset();
      dialogRef.current?.close();
    });
  }

  function replacePicture(
    pictureId: string,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    const fileError = validateFile(file);

    if (fileError || !file) {
      setError(fileError ?? "Seleccioná una imagen");
      input.value = "";
      return;
    }

    const data = baseData("replace");
    data.set("pictureId", pictureId);
    data.set("file", file, file.name);
    runMutation(data, () => {
      input.value = "";
      dialogRef.current?.close();
    });
  }

  function removePicture(pictureId: string) {
    if (!window.confirm("¿Querés eliminar esta imagen de la publicación?")) {
      return;
    }

    const data = baseData("remove");
    data.set("pictureId", pictureId);
    runMutation(data, () => {
      setOrderedPictures((current) =>
        current.filter((picture) => picture.id !== pictureId),
      );
      setOrderDirty(false);
    });
  }

  function movePicture(index: number, offset: -1 | 1) {
    setOrderedPictures((current) => {
      const targetIndex = index + offset;

      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
    setOrderDirty(true);
  }

  function saveOrder() {
    const data = baseData("reorder");
    data.set(
      "pictureIds",
      JSON.stringify(orderedPictures.map((picture) => picture.id)),
    );
    runMutation(data, () => setOrderDirty(false));
  }

  function resetDialogState() {
    setError(null);
    setOrderedPictures([...pictures]);
    setOrderDirty(false);
  }

  return (
    <>
      <div className="flex max-w-full flex-wrap items-center gap-2">
        {visiblePictures.map((picture, index) => (
          <button
            key={picture.id}
            type="button"
            onClick={() => {
              setError(null);
              setOrderedPictures([...pictures]);
              setOrderDirty(false);
              dialogRef.current?.showModal();
            }}
            aria-label={`Gestionar imagen ${index + 1} de ${title}`}
            title="Gestionar imágenes"
            className={`relative shrink-0 overflow-hidden rounded-xl border border-dashboard-border bg-white transition-all hover:-translate-y-0.5 hover:border-dashboard-accent-border hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent ${compact ? "h-11 w-11" : "h-14 w-14"}`}
          >
            <Image
              src={picture.url}
              alt=""
              fill
              sizes={compact ? "44px" : "56px"}
              className="object-contain p-1"
            />
            {index === visiblePictures.length - 1 &&
            pictures.length > visiblePictures.length ? (
              <span className="absolute inset-0 flex items-center justify-center bg-slate-950/65 text-[0.65rem] font-semibold text-white">
                +{pictures.length - visiblePictures.length}
              </span>
            ) : null}
          </button>
        ))}

        <button
          type="button"
          onClick={() => {
            setError(null);
            setOrderedPictures([...pictures]);
            setOrderDirty(false);
            dialogRef.current?.showModal();
          }}
          aria-label={`Agregar imagen a ${title}`}
          title="Agregar imagen"
          className={`inline-flex shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-dashboard-accent-border bg-dashboard-accent-soft px-1 text-[0.58rem] font-semibold leading-tight text-dashboard-accent-foreground transition-all hover:-translate-y-0.5 hover:bg-dashboard-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent ${compact ? "h-11 min-w-11" : "h-14 min-w-14"}`}
        >
          <ImagePlus aria-hidden="true" className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          <span className="mt-1">Agregar</span>
        </button>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby={headingId}
        onClose={resetDialogState}
        className="m-auto max-h-[90dvh] w-[min(56rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-dashboard-border bg-card p-0 text-dashboard-foreground shadow-2xl backdrop:bg-slate-950/45 backdrop:backdrop-blur-sm"
      >
        <div className="flex max-h-[90dvh] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-dashboard-border px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <h2 id={headingId} className="text-lg font-semibold tracking-tight">
                Imágenes de la publicación
              </h2>
              <p className="mt-1 truncate text-sm text-dashboard-muted" title={title}>
                {title}
              </p>
            </div>
            <button
              type="button"
              aria-label="Cerrar gestor de imágenes"
              title="Cerrar"
              disabled={pending}
              onClick={() => dialogRef.current?.close()}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-dashboard-muted transition-colors hover:bg-dashboard-control hover:text-dashboard-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent disabled:opacity-50"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </header>

          <div className="overflow-y-auto p-5 sm:p-6" aria-busy={pending}>
            <form
              onSubmit={submitUpload}
              className="flex flex-col gap-3 rounded-2xl border border-dashed border-dashboard-accent-border bg-dashboard-accent-soft p-4 sm:flex-row sm:items-end"
            >
              <label className="min-w-0 flex-1 text-xs font-semibold text-dashboard-foreground">
                Agregar imagen
                <input
                  type="file"
                  name="file"
                  accept="image/jpeg,image/png"
                  disabled={pending}
                  className="mt-2 block w-full text-xs text-dashboard-muted file:mr-3 file:rounded-lg file:border-0 file:bg-card file:px-3 file:py-2 file:text-xs file:font-semibold file:text-dashboard-foreground hover:file:bg-dashboard-control"
                />
              </label>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-dashboard-accent px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent disabled:cursor-wait disabled:opacity-60"
              >
                {pending ? (
                  <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus aria-hidden="true" className="h-4 w-4" />
                )}
                Subir
              </button>
            </form>

            <p className="mt-2 text-xs text-dashboard-muted">
              JPEG o PNG, hasta 10 MB por imagen.
            </p>

            {error ? (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            {orderedPictures.length > 0 ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {orderedPictures.map((picture, index) => (
                  <article
                    key={picture.id}
                    className="overflow-hidden rounded-2xl border border-dashboard-border bg-card"
                  >
                    <div className="relative aspect-square bg-white">
                      <Image
                        src={picture.url}
                        alt={`Imagen ${index + 1} de ${title}`}
                        fill
                        sizes="(max-width: 640px) calc(100vw - 74px), (max-width: 1024px) 40vw, 260px"
                        className="object-contain p-3"
                      />
                      <span className="absolute left-2 top-2 rounded-full bg-slate-950/75 px-2 py-1 text-[0.65rem] font-semibold text-white">
                        {index + 1}
                      </span>
                    </div>

                    <div className="space-y-3 border-t border-dashboard-border p-3">
                      <p className="truncate font-mono text-[0.65rem] text-dashboard-muted" title={picture.id}>
                        {picture.id}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={pending || index === 0}
                          onClick={() => movePicture(index, -1)}
                          aria-label={`Mover imagen ${index + 1} hacia arriba`}
                          className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-dashboard-border text-xs font-semibold transition-colors hover:bg-dashboard-control disabled:opacity-40"
                        >
                          <ArrowUp aria-hidden="true" className="h-3.5 w-3.5" />
                          Antes
                        </button>
                        <button
                          type="button"
                          disabled={pending || index === orderedPictures.length - 1}
                          onClick={() => movePicture(index, 1)}
                          aria-label={`Mover imagen ${index + 1} hacia abajo`}
                          className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-dashboard-border text-xs font-semibold transition-colors hover:bg-dashboard-control disabled:opacity-40"
                        >
                          <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
                          Después
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <label className={`inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border border-dashboard-border text-xs font-semibold transition-colors hover:bg-dashboard-control ${pending ? "pointer-events-none opacity-50" : ""}`}>
                          Reemplazar
                          <input
                            type="file"
                            accept="image/jpeg,image/png"
                            disabled={pending}
                            onChange={(event) => replacePicture(picture.id, event)}
                            className="sr-only"
                          />
                        </label>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => removePicture(picture.id)}
                          className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-red-200 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-dashboard-border px-5 py-10 text-center text-sm text-dashboard-muted">
                Esta publicación todavía no tiene imágenes guardadas.
              </div>
            )}
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-dashboard-border px-5 py-4 sm:px-6">
            <button
              type="button"
              disabled={pending}
              onClick={() => dialogRef.current?.close()}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-dashboard-border px-3 text-xs font-semibold transition-colors hover:bg-dashboard-control disabled:opacity-50"
            >
              Cerrar
            </button>
            <button
              type="button"
              disabled={pending || !orderDirty}
              onClick={saveOrder}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-dashboard-accent px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? (
                <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : null}
              Guardar orden
            </button>
          </footer>
        </div>
      </dialog>
    </>
  );
}

function validateFile(file: File | null | undefined) {
  if (!file) {
    return "Seleccioná una imagen";
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return "La imagen debe ser JPEG o PNG";
  }

  if (file.size > MAX_PICTURE_SIZE) {
    return "La imagen no puede superar los 10 MB";
  }

  return null;
}
