export type PublicationTarget = Readonly<{
  itemId: string | null;
  variationId: string | null;
  userProductId: string | null;
}>;

export type PublicationPriceSummary = PublicationTarget &
  Readonly<{
    currencyId: string | null;
    standardPrice: number | null;
    salePrice: number | null;
    regularPrice: number | null;
    promotionPrice: number | null;
    promotionPercentage: number | null;
    promotionId: string | null;
    promotionType: string | null;
    promotionStatus: string | null;
    promotionStartDate: string | null;
    promotionEndDate: string | null;
  }>;

export type PublicationPrices = Readonly<{
  productId: string;
  summary: PublicationPriceSummary;
  targets: readonly PublicationPriceSummary[];
}>;

export type PublicationPromotion = PublicationTarget &
  Readonly<{
    id: string | null;
    type: string;
    status: string | null;
    name: string | null;
    regularPrice: number | null;
    promotionPrice: number | null;
    percentage: number | null;
    startDate: string | null;
    endDate: string | null;
    canApply: boolean;
    canRemove: boolean;
  }>;
