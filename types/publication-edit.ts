export type PublicationEditCommand =
  | Readonly<{
      kind: "shared-price";
      productId: string;
      price: number;
    }>
  | Readonly<{
      kind: "shared-stock";
      productId: string;
      variationId?: string;
      stock: number;
    }>
  | Readonly<{
      kind: "variant-price";
      productId: string;
      itemId: string;
      price: number;
    }>
  | Readonly<{
      kind: "variant-stock";
      productId: string;
      itemId: string;
      stock: number;
    }>;

export type PublicationEditResult =
  | Readonly<{ ok: true }>
  | Readonly<{
      ok: false;
      error: string;
      status: number;
    }>;
