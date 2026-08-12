const textCollator = new Intl.Collator("es-AR", {
  numeric: true,
  sensitivity: "base",
});

type VariantSize = Readonly<{
  filterableSize: string | null;
  size: string | null;
}>;

export function getVariantDisplaySize(variant: VariantSize) {
  return variant.filterableSize || variant.size;
}

export function comparePublicationSizes(
  left: string | null,
  right: string | null,
) {
  if (left === right) return 0;
  if (!left) return 1;
  if (!right) return -1;

  const leftKey = sizeKey(left);
  const rightKey = sizeKey(right);

  if (leftKey.group !== rightKey.group) {
    return leftKey.group - rightKey.group;
  }

  if (leftKey.rank !== rightKey.rank) {
    return leftKey.rank - rightKey.rank;
  }

  return textCollator.compare(left, right);
}

export function comparePublicationText(
  left: string | null,
  right: string | null,
) {
  if (left === right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  return textCollator.compare(left, right);
}

function sizeKey(value: string) {
  const normalized = value.trim().toUpperCase().replaceAll(" ", "");
  const numericValue = Number(normalized.replace(",", "."));

  if (/^\d+(?:[.,]\d+)?$/.test(normalized)) {
    return { group: 0, rank: numericValue };
  }

  const clothingRank = getClothingRank(normalized);

  if (clothingRank !== null) {
    return { group: 1, rank: clothingRank };
  }

  const leadingNumber = /^(\d+(?:[.,]\d+)?)/.exec(normalized);

  if (leadingNumber) {
    return {
      group: 0,
      rank: Number(leadingNumber[1].replace(",", ".")),
    };
  }

  return { group: 2, rank: 0 };
}

function getClothingRank(value: string) {
  const baseSizes: Record<string, number> = {
    XXS: 0,
    XS: 1,
    S: 2,
    M: 3,
    L: 4,
  };

  if (value in baseSizes) {
    return baseSizes[value];
  }

  const numericExtraLarge = /^(\d+)XL$/.exec(value);

  if (numericExtraLarge) {
    return 4 + Number(numericExtraLarge[1]);
  }

  const repeatedExtraLarge = /^(X+)L$/.exec(value);

  return repeatedExtraLarge ? 4 + repeatedExtraLarge[1].length : null;
}
