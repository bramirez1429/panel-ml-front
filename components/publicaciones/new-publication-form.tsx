"use client";

import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Plus,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  loadPublicationCategory,
  publishPublication,
  searchPublicationCategories,
  validatePublicationDraft,
} from "@/app/dashboard/publicaciones/nueva/actions";
import type {
  PublicationCategory,
  PublicationCategoryAttribute,
  PublicationCategorySchema,
  PublicationDraft,
  PublicationDraftAttribute,
  PublicationValidationResult,
} from "@/types/publication-publishing";

type VariationState = {
  localId: number;
  sku: string;
  price: string;
  stock: string;
  attributes: Record<string, string>;
  pictures: string;
};

const fieldClassName =
  "mt-1.5 h-10 w-full rounded-lg border border-dashboard-border bg-card px-3 text-sm text-dashboard-foreground outline-none transition-shadow focus:border-dashboard-accent-border focus:ring-2 focus:ring-dashboard-accent";

export function NewPublicationForm() {
  const router = useRouter();
  const [categoryQuery, setCategoryQuery] = useState("");
  const [categories, setCategories] = useState<readonly PublicationCategory[]>([]);
  const [schema, setSchema] = useState<PublicationCategorySchema | null>(null);
  const [title, setTitle] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [description, setDescription] = useState("");
  const [currencyId, setCurrencyId] = useState("ARS");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [listingTypeId, setListingTypeId] = useState("");
  const [condition, setCondition] = useState("new");
  const [pictures, setPictures] = useState("");
  const [shippingMode, setShippingMode] = useState("");
  const [freeShipping, setFreeShipping] = useState(false);
  const [localPickup, setLocalPickup] = useState(false);
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [saleTerms, setSaleTerms] = useState<Record<string, string>>({});
  const [variations, setVariations] = useState<VariationState[]>([]);
  const [nextVariationId, setNextVariationId] = useState(2);
  const [validation, setValidation] = useState<PublicationValidationResult | null>(null);
  const [validatedSnapshot, setValidatedSnapshot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searching, startSearch] = useTransition();
  const [loadingCategory, startCategoryLoad] = useTransition();
  const [validating, startValidation] = useTransition();
  const [publishing, startPublishing] = useTransition();

  const commonAttributes = useMemo(
    () =>
      schema?.attributes.filter(
        (attribute) =>
          attribute.inputAllowed &&
          attribute.id !== "ITEM_CONDITION" &&
          attribute.role !== "CHILD_PK",
      ) ?? [],
    [schema],
  );
  const childAttributes = useMemo(
    () =>
      schema?.attributes.filter(
        (attribute) => attribute.inputAllowed && attribute.role === "CHILD_PK",
      ) ?? [],
    [schema],
  );
  const draft = useMemo(
    () =>
      buildDraft({
        schema,
        title,
        familyName,
        description,
        currencyId,
        price,
        stock,
        listingTypeId,
        condition,
        pictures,
        shippingMode,
        freeShipping,
        localPickup,
        attributes,
        saleTerms,
        commonAttributes,
        childAttributes,
        variations,
      }),
    [
      schema,
      title,
      familyName,
      description,
      currencyId,
      price,
      stock,
      listingTypeId,
      condition,
      pictures,
      shippingMode,
      freeShipping,
      localPickup,
      attributes,
      saleTerms,
      commonAttributes,
      childAttributes,
      variations,
    ],
  );
  const snapshot = JSON.stringify(draft);
  const canPublish = validation?.valid && validatedSnapshot === snapshot;

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startSearch(async () => {
      const result = await searchPublicationCategories(categoryQuery);
      if (!result.ok) {
        setCategories([]);
        setError(result.error);
        return;
      }
      setCategories(result.categories);
      if (result.categories.length === 0) {
        setError("No encontramos categorías para esa búsqueda");
      }
    });
  }

  function selectCategory(category: PublicationCategory) {
    setError(null);
    setValidation(null);
    setValidatedSnapshot(null);
    startCategoryLoad(async () => {
      const result = await loadPublicationCategory(category.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      const nextSchema = {
        ...result.schema,
        category: result.schema.category.id === category.id ? result.schema.category : category,
      };
      setSchema(nextSchema);
      setCategoryQuery(category.name);
      setCategories([]);
      setAttributes({});
      setSaleTerms({});
      setListingTypeId(nextSchema.listingTypes[0]?.id ?? "");
      setCondition(nextSchema.conditions[0]?.id ?? "new");
      const hasChildren = nextSchema.attributes.some(
        (attribute) => attribute.role === "CHILD_PK",
      );
      setVariations(
        hasChildren
          ? [{ localId: 1, sku: "", price, stock, attributes: {}, pictures: "" }]
          : [],
      );
      setNextVariationId(2);
    });
  }

  function addVariation() {
    if (schema?.settings.maxVariations !== null &&
        schema?.settings.maxVariations !== undefined &&
        variations.length >= schema.settings.maxVariations) {
      setError(`Mercado Libre admite hasta ${schema.settings.maxVariations} variantes en esta categoría`);
      return;
    }
    setVariations((current) => [
      ...current,
      {
        localId: nextVariationId,
        sku: "",
        price,
        stock,
        attributes: {},
        pictures: "",
      },
    ]);
    setNextVariationId((value) => value + 1);
  }

  function updateVariation(localId: number, update: Partial<VariationState>) {
    setVariations((current) =>
      current.map((variation) =>
        variation.localId === localId ? { ...variation, ...update } : variation,
      ),
    );
  }

  function validate() {
    if (!schema) {
      setError("Seleccioná una categoría");
      return;
    }

    setError(null);
    setValidation(null);
    setValidatedSnapshot(null);
    startValidation(async () => {
      const result = await validatePublicationDraft(draft);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setValidation(result.result);
      if (result.result.valid) setValidatedSnapshot(snapshot);
    });
  }

  function publish() {
    if (!canPublish) {
      setError("Volvé a validar el borrador antes de publicar");
      return;
    }

    setError(null);
    startPublishing(async () => {
      const result = await publishPublication(draft);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/dashboard/publicaciones/${encodeURIComponent(result.productId)}`);
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-dashboard-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-dashboard-foreground">1. Categoría</h2>
        <p className="mt-1 text-sm text-dashboard-muted">
          La búsqueda y los atributos se consultan a Mercado Libre a través del backend.
        </p>
        <form onSubmit={search} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="category-search">Buscar categoría</label>
          <input
            id="category-search"
            type="search"
            value={categoryQuery}
            onChange={(event) => setCategoryQuery(event.target.value)}
            placeholder="Ej.: zapatillas deportivas"
            className="h-11 min-w-0 flex-1 rounded-xl border border-dashboard-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-dashboard-accent"
          />
          <button
            type="submit"
            disabled={searching || loadingCategory}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-dashboard-accent px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {searching ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Search aria-hidden="true" className="h-4 w-4" />}
            Buscar
          </button>
        </form>
        {categories.length > 0 ? (
          <ul className="mt-3 divide-y divide-dashboard-border overflow-hidden rounded-xl border border-dashboard-border">
            {categories.map((category) => (
              <li key={category.id}>
                <button
                  type="button"
                  disabled={loadingCategory}
                  onClick={() => selectCategory(category)}
                  className="w-full px-4 py-3 text-left transition-colors hover:bg-dashboard-control disabled:opacity-60"
                >
                  <span className="block text-sm font-semibold text-dashboard-foreground">{category.name}</span>
                  <span className="mt-0.5 block text-xs text-dashboard-muted">{category.path || category.id}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {loadingCategory ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-dashboard-muted">
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            Consultando atributos requeridos…
          </p>
        ) : null}
        {schema ? (
          <div className="mt-4 rounded-xl border border-dashboard-accent-border bg-dashboard-accent-soft px-4 py-3">
            <p className="text-sm font-semibold text-dashboard-accent-foreground">
              {schema.category.name} · {schema.category.id}
            </p>
            <p className="mt-1 text-xs text-dashboard-muted">
              {schema.usesUserProducts
                ? "Categoría con modelo User Products: se respetarán family_name, parent PK y child PK."
                : "Flujo de publicación informado por Mercado Libre para esta categoría."}
            </p>
            {schema.settings.listingAllowed === false ? (
              <p className="mt-2 text-xs font-semibold text-red-700">
                Mercado Libre informa que esta categoría no permite nuevas publicaciones.
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      {schema ? (
        <>
          <section className="rounded-2xl border border-dashboard-border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-dashboard-foreground">2. Datos comunes</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {!schema.usesUserProducts ? (
                <Field label="Título" required wide>
                  <input className={fieldClassName} value={title} required onChange={(event) => setTitle(event.target.value)} />
                </Field>
              ) : (
                <div className="sm:col-span-2 rounded-xl border border-dashboard-border bg-dashboard-control px-4 py-3 text-sm text-dashboard-muted">
                  Mercado Libre genera el título desde <code>family_name</code> y los atributos de la familia.
                </div>
              )}
              {schema.usesUserProducts || schema.familyNameRequired ? (
                <Field label="Family name" required={schema.usesUserProducts || schema.familyNameRequired} wide>
                  <input className={fieldClassName} value={familyName} required={schema.usesUserProducts || schema.familyNameRequired} onChange={(event) => setFamilyName(event.target.value)} />
                </Field>
              ) : null}
              <Field label="Precio" required>
                <input className={fieldClassName} type="number" min="0.01" step="0.01" value={price} required onChange={(event) => setPrice(event.target.value)} />
              </Field>
              <Field label="Stock" required>
                <input className={fieldClassName} type="number" min="0" step="1" value={stock} required onChange={(event) => setStock(event.target.value)} />
              </Field>
              <Field label="Moneda" required>
                <input className={fieldClassName} value={currencyId} required onChange={(event) => setCurrencyId(event.target.value.toUpperCase())} />
              </Field>
              <Field label="Listing type" required>
                {schema.listingTypes.length > 0 ? (
                  <select className={fieldClassName} value={listingTypeId} required onChange={(event) => setListingTypeId(event.target.value)}>
                    {schema.listingTypes.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                  </select>
                ) : (
                  <input className={fieldClassName} value={listingTypeId} required onChange={(event) => setListingTypeId(event.target.value)} />
                )}
              </Field>
              <Field label="Condición" required>
                {schema.conditions.length > 0 ? (
                  <select className={fieldClassName} value={condition} required onChange={(event) => setCondition(event.target.value)}>
                    {schema.conditions.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                  </select>
                ) : (
                  <input className={fieldClassName} value={condition} required onChange={(event) => setCondition(event.target.value)} />
                )}
              </Field>
              <Field label="Imágenes HTTPS (una URL por línea)" wide>
                <textarea className="mt-1.5 min-h-28 w-full rounded-lg border border-dashboard-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-dashboard-accent" value={pictures} onChange={(event) => setPictures(event.target.value)} />
              </Field>
              <Field label="Descripción" wide>
                <textarea
                  className="mt-1.5 min-h-32 w-full rounded-lg border border-dashboard-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-dashboard-accent"
                  value={description}
                  maxLength={50_000}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </Field>
            </div>
          </section>

          {schema.saleTerms.length > 0 ? (
            <section className="rounded-2xl border border-dashboard-border bg-card p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-dashboard-foreground">
                Términos de venta
              </h2>
              <p className="mt-1 text-sm text-dashboard-muted">
                Las garantías y condiciones disponibles provienen de Mercado Libre.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {schema.saleTerms.filter((term) => term.inputAllowed).map((term) => (
                  <AttributeInput
                    key={term.id}
                    attribute={term}
                    required={isRequired(term, condition)}
                    value={saleTerms[term.id] ?? ""}
                    onChange={(value) =>
                      setSaleTerms((current) => ({ ...current, [term.id]: value }))
                    }
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-dashboard-border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-dashboard-foreground">3. Atributos de categoría</h2>
            <p className="mt-1 text-sm text-dashboard-muted">No se hardcodean obligatorios: provienen del esquema de Mercado Libre.</p>
            {commonAttributes.length > 0 ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {commonAttributes.map((attribute) => (
                  <AttributeInput
                    key={attribute.id}
                    attribute={attribute}
                    required={isRequired(attribute, condition)}
                    value={attributes[attribute.id] ?? ""}
                    onChange={(value) => setAttributes((current) => ({ ...current, [attribute.id]: value }))}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-dashboard-muted">La categoría no informó atributos comunes.</p>
            )}
          </section>

          {childAttributes.length > 0 ? (
            <section className="rounded-2xl border border-dashboard-border bg-card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-dashboard-foreground">4. Variantes</h2>
                  <p className="mt-1 text-sm text-dashboard-muted">Cada variante completa los child PK definidos por Mercado Libre.</p>
                </div>
                <button type="button" onClick={addVariation} className="inline-flex h-9 items-center gap-2 rounded-lg border border-dashboard-border px-3 text-xs font-semibold hover:bg-dashboard-control">
                  <Plus aria-hidden="true" className="h-3.5 w-3.5" /> Agregar variante
                </button>
              </div>
              <div className="mt-4 space-y-4">
                {variations.map((variation, index) => (
                  <article key={variation.localId} className="rounded-xl border border-dashboard-border bg-dashboard-control p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-dashboard-foreground">Variante {index + 1}</h3>
                      <button type="button" disabled={variations.length === 1} onClick={() => setVariations((current) => current.filter((item) => item.localId !== variation.localId))} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40">
                        <Trash2 aria-hidden="true" className="h-3.5 w-3.5" /> Quitar
                      </button>
                    </div>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {childAttributes.map((attribute) => (
                        <AttributeInput
                          key={attribute.id}
                          attribute={attribute}
                          required={isRequired(attribute, condition)}
                          value={variation.attributes[attribute.id] ?? ""}
                          onChange={(value) => updateVariation(variation.localId, { attributes: { ...variation.attributes, [attribute.id]: value } })}
                        />
                      ))}
                      <Field label="SKU">
                        <input className={fieldClassName} value={variation.sku} onChange={(event) => updateVariation(variation.localId, { sku: event.target.value })} />
                      </Field>
                      {schema.usesUserProducts ? (
                        <Field label="Precio" required>
                          <input className={fieldClassName} type="number" min="0.01" step="0.01" value={variation.price} required onChange={(event) => updateVariation(variation.localId, { price: event.target.value })} />
                        </Field>
                      ) : null}
                      <Field label="Stock" required>
                        <input className={fieldClassName} type="number" min="0" step="1" value={variation.stock} required onChange={(event) => updateVariation(variation.localId, { stock: event.target.value })} />
                      </Field>
                      {schema.usesUserProducts ? (
                        <Field label="Imágenes HTTPS (una URL por línea)" wide>
                          <textarea className="mt-1.5 min-h-24 w-full rounded-lg border border-dashboard-border bg-card px-3 py-2 text-sm" value={variation.pictures} onChange={(event) => updateVariation(variation.localId, { pictures: event.target.value })} />
                        </Field>
                      ) : (
                        <p className="self-end text-xs text-dashboard-muted lg:col-span-3">
                          En el modelo legacy, las variantes comparten la galería principal.
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-dashboard-border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-dashboard-foreground">{childAttributes.length > 0 ? "5" : "4"}. Envío y validación</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {schema.settings.shippingModes.length > 0 ? (
                <Field label="Modo de envío (opcional)">
                  <select className={fieldClassName} value={shippingMode} onChange={(event) => setShippingMode(event.target.value)}>
                    <option value="">Automático / no especificado</option>
                    {schema.settings.shippingModes.map((mode) => (
                      <option key={mode} value={mode}>{mode}</option>
                    ))}
                  </select>
                </Field>
              ) : null}
              <div className="flex flex-col justify-end gap-3 pb-1 text-sm text-dashboard-foreground">
                <label className="flex items-center gap-2"><input type="checkbox" checked={freeShipping} onChange={(event) => setFreeShipping(event.target.checked)} /> Envío gratis</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={localPickup} onChange={(event) => setLocalPickup(event.target.checked)} /> Retiro en persona</label>
              </div>
            </div>

            {error ? (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
                <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </p>
            ) : null}
            {validation ? <ValidationPreview validation={validation} /> : null}

            <div className="mt-5 flex flex-col-reverse gap-3 border-t border-dashboard-border pt-5 sm:flex-row sm:justify-end">
              <button type="button" disabled={validating || publishing} onClick={validate} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-dashboard-accent-border bg-dashboard-accent-soft px-4 text-sm font-semibold text-dashboard-accent-foreground disabled:opacity-60">
                {validating ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <CheckCircle2 aria-hidden="true" className="h-4 w-4" />}
                Validar y previsualizar
              </button>
              <button type="button" disabled={!canPublish || publishing || validating} onClick={publish} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-dashboard-accent px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
                {publishing ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Send aria-hidden="true" className="h-4 w-4" />}
                Publicar en Mercado Libre
              </button>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function Field({
  label,
  required = false,
  wide = false,
  children,
}: Readonly<{
  label: string;
  required?: boolean;
  wide?: boolean;
  children: ReactNode;
}>) {
  return (
    <label className={`text-xs font-semibold text-dashboard-foreground ${wide ? "sm:col-span-2" : ""}`}>
      {label}{required ? " *" : ""}
      {children}
    </label>
  );
}

function AttributeInput({
  attribute,
  required,
  value,
  onChange,
}: Readonly<{
  attribute: PublicationCategoryAttribute;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}>) {
  const isRequiredField = required ?? attribute.required;
  const closedValues =
    attribute.values.length > 0 && !allowsCustomValue(attribute);
  return (
    <Field label={attribute.name} required={isRequiredField}>
      {closedValues ? (
        <select className={fieldClassName} value={value} required={isRequiredField} onChange={(event) => onChange(event.target.value)}>
          <option value="">Seleccionar</option>
          {attribute.values.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
        </select>
      ) : (
        <>
          <input
            className={fieldClassName}
            value={value}
            list={
              attribute.values.length > 0
                ? `publishing-${attribute.id}`
                : undefined
            }
            required={isRequiredField}
            maxLength={attribute.valueMaxLength ?? undefined}
            placeholder={attribute.valueType ?? undefined}
            onChange={(event) => onChange(event.target.value)}
          />
          {attribute.values.length > 0 ? (
            <datalist id={`publishing-${attribute.id}`}>
              {attribute.values.map((option) => (
                <option key={option.id} value={option.name} />
              ))}
            </datalist>
          ) : null}
        </>
      )}
    </Field>
  );
}

function ValidationPreview({ validation }: Readonly<{ validation: PublicationValidationResult }>) {
  return (
    <div className={`mt-4 rounded-xl border px-4 py-3 ${validation.valid ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
      <p className={`flex items-center gap-2 text-sm font-semibold ${validation.valid ? "text-emerald-800" : "text-amber-800"}`}>
        {validation.valid ? <CheckCircle2 aria-hidden="true" className="h-4 w-4" /> : <AlertCircle aria-hidden="true" className="h-4 w-4" />}
        {validation.valid ? "Borrador válido para publicar" : "Mercado Libre informó observaciones"}
      </p>
      {validation.issues.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-700">
          {validation.issues.map((issue, index) => (
            <li key={`${issue.code ?? "issue"}-${index}`}>
              {issue.itemIndex !== null ? `Variante ${issue.itemIndex + 1}: ` : ""}
              {issue.field ? `${issue.field}: ` : ""}{issue.message}
            </li>
          ))}
        </ul>
      ) : null}
      {validation.preview !== null && validation.preview !== undefined ? (
        <details className="mt-3 text-xs text-slate-700">
          <summary className="cursor-pointer font-semibold">Ver payload previsualizado</summary>
          <pre className="mt-2 max-h-72 overflow-auto rounded-lg bg-white/70 p-3 text-[0.68rem]">{safeJson(validation.preview)}</pre>
        </details>
      ) : null}
    </div>
  );
}

function buildDraft(input: {
  schema: PublicationCategorySchema | null;
  title: string;
  familyName: string;
  description: string;
  currencyId: string;
  price: string;
  stock: string;
  listingTypeId: string;
  condition: string;
  pictures: string;
  shippingMode: string;
  freeShipping: boolean;
  localPickup: boolean;
  attributes: Record<string, string>;
  saleTerms: Record<string, string>;
  commonAttributes: readonly PublicationCategoryAttribute[];
  childAttributes: readonly PublicationCategoryAttribute[];
  variations: readonly VariationState[];
}): PublicationDraft {
  return {
    categoryId: input.schema?.category.id ?? "",
    ...(!input.schema?.usesUserProducts && input.title.trim()
      ? { title: input.title.trim() }
      : {}),
    ...((input.schema?.usesUserProducts || input.schema?.familyNameRequired) &&
    input.familyName.trim()
      ? { familyName: input.familyName.trim() }
      : {}),
    currencyId: input.currencyId,
    price: Number(input.price),
    stock: parseNumberInput(input.stock),
    listingTypeId: input.listingTypeId,
    condition: input.condition,
    ...(input.description.trim() ? { description: input.description.trim() } : {}),
    pictures: parsePictures(input.pictures),
    attributes: input.commonAttributes.flatMap((attribute) => toDraftAttribute(attribute, input.attributes[attribute.id])),
    saleTerms: (input.schema?.saleTerms ?? []).flatMap((term) =>
      toDraftAttribute(term, input.saleTerms[term.id]),
    ),
    variations: input.childAttributes.length === 0
      ? []
      : input.variations.map((variation) => ({
          sku: variation.sku,
          price: input.schema?.usesUserProducts
            ? Number(variation.price)
            : Number(input.price),
          stock: parseNumberInput(variation.stock),
          pictures: input.schema?.usesUserProducts
            ? parsePictures(variation.pictures)
            : [],
          attributes: input.childAttributes.flatMap((attribute) => toDraftAttribute(attribute, variation.attributes[attribute.id])),
        })),
    shipping: {
      ...(input.shippingMode.trim() ? { mode: input.shippingMode.trim() } : {}),
      freeShipping: input.freeShipping,
      localPickup: input.localPickup,
    },
  };
}

function toDraftAttribute(
  attribute: PublicationCategoryAttribute,
  rawValue: string | undefined,
): readonly PublicationDraftAttribute[] {
  const value = rawValue?.trim();
  if (!value) return [];
  const allowed = attribute.values.find(
    (option) => option.id === value || option.name === value,
  );
  return [{ id: attribute.id, ...(allowed ? { valueId: allowed.id } : { valueName: value }) }];
}

function parsePictures(value: string) {
  return value.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean);
}

function parseNumberInput(value: string): number {
  return value.trim() ? Number(value) : Number.NaN;
}

function isRequired(
  attribute: PublicationCategoryAttribute,
  condition: string,
): boolean {
  return attribute.required || (attribute.requiredOnNew && condition === "new");
}

function allowsCustomValue(attribute: PublicationCategoryAttribute): boolean {
  const valueType = attribute.valueType?.toLowerCase();
  return !valueType || !["list", "boolean"].includes(valueType);
}

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "No se pudo representar la previsualización";
  }
}
