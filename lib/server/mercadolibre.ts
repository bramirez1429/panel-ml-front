import "server-only";

import { getPublications } from "@/lib/api/publications";

export type {
  Publication,
  PublicationsPage as PublicacionesResponse,
} from "@/types/publication";

export function getPublicaciones(page = 1, limit = 20) {
  return getPublications({ page, limit });
}
