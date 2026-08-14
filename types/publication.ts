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

export type PublicationAttribute = Readonly<{
  id: string;
  value: string | null;
}>;

export type PublicationPicture = Readonly<{
  id: string;
  url: string;
}>;

export type SharedVariationDetail = Readonly<{
  id: string;
  label: string | null;
  color: string | null;
  size: string | null;
  sku: string | null;
  availableQuantity: number | null;
  soldQuantity: number | null;
  attributes: readonly PublicationAttribute[];
}>;

export type VariantPricingChildDetail = Readonly<{
  id: string;
  title: string | null;
  thumbnail: string | null;
  itemId: string | null;
  userProductId: string | null;
  color: string | null;
  size: string | null;
  filterableSize: string | null;
  sku: string | null;
  price: number | null;
  currencyId: string | null;
  availableQuantity: number | null;
  soldQuantity: number | null;
  status: string | null;
  listingTypeId: string | null;
  permalink: string | null;
  pictures: readonly PublicationPicture[];
  attributes: readonly PublicationAttribute[];
}>;

export type PublicationDetail = Publication &
  Readonly<{
    familyId: string | null;
    parentItemId: string | null;
    sku: string | null;
    description: string | null;
    attributes: readonly PublicationAttribute[];
    permalink: string | null;
    pictures: readonly PublicationPicture[];
    sharedVariations: readonly SharedVariationDetail[];
    children: readonly VariantPricingChildDetail[];
  }>;
