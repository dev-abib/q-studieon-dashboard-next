export interface Insight {
  id: string;
  title: string;
  subTitle: string;
  description: string;
  redirectLink: string | null;
  icon: string | null;
  iconPublicId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InsightMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}
