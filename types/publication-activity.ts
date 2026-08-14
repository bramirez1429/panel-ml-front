export type PublicationActionStatus = "SUCCESS" | "FAILED";

export type PublicationAction = Readonly<{
  id: string;
  action: string;
  status: PublicationActionStatus;
  itemId: string | null;
  oldValue: unknown;
  newValue: unknown;
  errorMessage: string | null;
  createdAt: string;
}>;

