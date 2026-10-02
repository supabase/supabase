export function paginateNPlusOne<T>(
  rows: T[],
  maxResults: number,
  getNextToken: (row: T) => string
): { pageRows: T[]; nextToken?: string } {
  const pageRows = rows.slice(0, maxResults)
  const hasMore = rows.length > maxResults

  return {
    pageRows,
    nextToken:
      hasMore && pageRows.length > 0 ? getNextToken(pageRows[pageRows.length - 1]) : undefined,
  }
}
