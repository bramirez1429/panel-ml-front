export type PublicationModel = "SHARED" | "VARIANT_PRICING";

export type PublicationPrice = Readonly<{
  from: number;
  to: number | null;
  currencyId: string;
}>;

export type Publication = Readonly<{
  id: string;
  model: PublicationModel;
  title: string | null;
  thumbnail: string | null;
  status: string | null;
  currencyId: string | null;
  stockTotal: number | null;
  variantsCount: number | null;
  sizes: readonly string[] | null;
  currentPrice: PublicationPrice | null;
  regularPrice: PublicationPrice | null;
  promotionPercentage: number | null;
  estimatedProfit: number | null;
  visits: number | null;
  hasFlex: boolean | null;
}>;

export type PublicationsPaging = Readonly<{
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}>;

export type PublicationsPage = Readonly<{
  publications: readonly Publication[];
  paging: PublicationsPaging;
}>;
