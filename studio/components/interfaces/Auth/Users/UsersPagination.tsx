import { Button } from 'ui'

import { USERS_PAGE_LIMIT } from 'data/auth/users-query'

interface UsersPaginationProps {
  total: number
  page: number
  setPage: (page: number) => void
}

const UsersPagination = ({ total, page, setPage }: UsersPaginationProps) => {
  const startRowFromPage = USERS_PAGE_LIMIT * (page - 1) + 1
  const fromRow = startRowFromPage > total ? total : startRowFromPage

  const endRowFromPage = USERS_PAGE_LIMIT * page
  const toRow = endRowFromPage > total ? total : endRowFromPage

  const hasPrevious = page > 1
  const hasNext = toRow < total

  return (
    <nav className="flex items-center justify-between overflow-hidden" aria-label="Pagination">
      <div className="hidden sm:block">
        <p className="text-xs text-foreground-lighter">
          Showing
          <span className="px-1 font-medium text-foreground-light">{fromRow}</span>
          to
          <span className="px-1 font-medium text-foreground-light">{toRow}</span>
          of
          <span className="px-1 font-medium text-foreground-light">{total}</span>
          results
        </p>
      </div>
      <div className="flex flex-1 justify-between sm:justify-end">
        {hasPrevious && (
          <Button type="default" disabled={!hasPrevious} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
        )}
        {hasNext && (
          <Button
            type="default"
            disabled={!hasNext}
            className="ml-3"
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        )}
      </div>
    </nav>
  )
}

export default UsersPagination
