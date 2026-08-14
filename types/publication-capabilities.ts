export type PublicationEditableField = Readonly<{
  editable: boolean;
  reason: string | null;
}>;

export type PublicationEditableAttribute = Readonly<{
  id: string;
  name: string;
  valueId: string | null;
  value: string | null;
  required: boolean;
  valueType: string | null;
  allowCustomValue: boolean;
  allowedValues: readonly Readonly<{ id: string; name: string }>[];
}>;

export type PublicationCapabilities = Readonly<{
  itemId: string | null;
  title: PublicationEditableField;
  description: PublicationEditableField;
  attributes: PublicationEditableField;
  editableAttributes: readonly PublicationEditableAttribute[];
  currentContent: Readonly<{
    title: string | null;
    description: string | null;
    attributes: readonly PublicationAttribute[];
  }>;
  priceDiscountApply: boolean;
  priceDiscountRemove: boolean;
}>;
import type { PublicationAttribute } from "@/types/publication";
