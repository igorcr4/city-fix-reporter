export interface PaginationResult<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  startItem: number;
  endItem: number;
}

export const MUNICIPAL_REPORTS_PER_PAGE = 10;

export function paginateItems<T>(
  items: T[],
  page: number,
  perPage = MUNICIPAL_REPORTS_PER_PAGE
): PaginationResult<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * perPage;
  const paginatedItems = items.slice(startIndex, startIndex + perPage);

  return {
    items: paginatedItems,
    currentPage,
    totalPages,
    startItem: items.length === 0 ? 0 : startIndex + 1,
    endItem: Math.min(startIndex + perPage, items.length),
  };
}
