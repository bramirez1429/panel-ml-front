export type PublicationContentResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; status: number; error: string }>;

export type PublicationAttributeUpdate = Readonly<{
  id: string;
  valueId?: string | null;
  valueName?: string | null;
}>;

export type PriceDiscountCommand = Readonly<{
  productId: string;
  dealPrice?: number;
  startDate?: string;
  finishDate?: string;
  itemId?: string;
  variationId?: string;
  userProductId?: string;
}>;
