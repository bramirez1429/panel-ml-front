export type PublicationSkuCommand =
  | Readonly<{
      model: "SHARED";
      productId: string;
      variationId?: string;
      sku: string;
    }>
  | Readonly<{
      model: "VARIANT_PRICING";
      productId: string;
      itemId: string;
      sku: string;
    }>;

export type PublicationStatusCommand = Readonly<{
  productId: string;
  itemId?: string;
  status: "active" | "paused";
}>;

export type PublicationManagementResult =
  | Readonly<{ ok: true }>
  | Readonly<{
      ok: false;
      error: string;
      status: number;
    }>;
