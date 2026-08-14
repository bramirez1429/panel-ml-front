export type PublicationCategory = Readonly<{
  id: string;
  name: string;
  path: string | null;
}>;

export type PublicationAttributeValue = Readonly<{
  id: string;
  name: string;
}>;

export type PublicationCategoryAttribute = Readonly<{
  id: string;
  name: string;
  required: boolean;
  requiredOnNew: boolean;
  valueType: string | null;
  role: "COMMON" | "PARENT_PK" | "CHILD_PK";
  inputAllowed: boolean;
  valueMaxLength: number | null;
  values: readonly PublicationAttributeValue[];
}>;

export type PublicationCategorySchema = Readonly<{
  category: PublicationCategory;
  usesUserProducts: boolean;
  familyNameRequired: boolean;
  attributes: readonly PublicationCategoryAttribute[];
  saleTerms: readonly PublicationCategoryAttribute[];
  listingTypes: readonly Readonly<{ id: string; name: string }>[];
  conditions: readonly Readonly<{ id: string; name: string }>[];
  settings: Readonly<{
    listingAllowed: boolean | null;
    maxPictures: number | null;
    maxPicturesPerVariation: number | null;
    maxVariations: number | null;
    shippingModes: readonly string[];
  }>;
}>;

export type PublicationDraftAttribute = Readonly<{
  id: string;
  valueId?: string;
  valueName?: string;
}>;

export type PublicationDraftVariation = Readonly<{
  sku: string;
  price: number;
  stock: number;
  attributes: readonly PublicationDraftAttribute[];
  pictures: readonly string[];
}>;

export type PublicationDraft = Readonly<{
  categoryId: string;
  title?: string;
  familyName?: string;
  currencyId: string;
  price: number;
  stock: number;
  listingTypeId: string;
  condition: string;
  description?: string;
  attributes: readonly PublicationDraftAttribute[];
  saleTerms: readonly PublicationDraftAttribute[];
  variations: readonly PublicationDraftVariation[];
  pictures: readonly string[];
  shipping: Readonly<{
    mode?: string;
    freeShipping?: boolean;
    localPickup?: boolean;
  }>;
}>;

export type PublicationValidationIssue = Readonly<{
  code: string | null;
  field: string | null;
  message: string;
  itemIndex: number | null;
}>;

export type PublicationValidationResult = Readonly<{
  valid: boolean;
  issues: readonly PublicationValidationIssue[];
  preview: unknown;
}>;

export type CategorySearchActionResult =
  | Readonly<{ ok: true; categories: readonly PublicationCategory[] }>
  | Readonly<{ ok: false; status: number; error: string }>;

export type CategorySchemaActionResult =
  | Readonly<{ ok: true; schema: PublicationCategorySchema }>
  | Readonly<{ ok: false; status: number; error: string }>;

export type PublicationValidationActionResult =
  | Readonly<{ ok: true; result: PublicationValidationResult }>
  | Readonly<{ ok: false; status: number; error: string }>;

export type PublicationPublishActionResult =
  | Readonly<{ ok: true; productId: string }>
  | Readonly<{ ok: false; status: number; error: string }>;
