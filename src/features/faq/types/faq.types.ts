export interface Faq {
  id: string;
  title: string;
  description: string;
  image: string | null;
  imagePublicId?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface FaqMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}
