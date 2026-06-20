export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  _count?: { questions: number };
  createdAt: string;
  updatedAt: string;
}

export interface CategoryMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}
