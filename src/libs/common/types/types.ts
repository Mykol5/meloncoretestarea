export interface PaginatedData {
  total: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  nextPage: number;
  hasPreviousPage: boolean;
  previousPage: number;
}
