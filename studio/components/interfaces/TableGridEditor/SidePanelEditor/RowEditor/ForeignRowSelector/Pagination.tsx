import { Button, IconArrowLeft, IconArrowRight, IconLoader } from 'ui'

export interface PaginationProps {
  page: number
  setPage: (setter: (prev: number) => number) => void
  rowsPerPage: number
  currentPageRowsCount?: number
  isLoading?: boolean
}

const Pagination = ({
  page,
  setPage,
  rowsPerPage,
  currentPageRowsCount = 0,
  isLoading = false,
}: PaginationProps) => {
  const onPreviousPage = () => {
    setPage((prev) => prev - 1)
  }

  const onNextPage = () => {
    setPage((prev) => prev + 1)
  }

  const hasRunOutOfRows = currentPageRowsCount < rowsPerPage

  return (
    <div className="flex items-center gap-2">
      {isLoading && <IconLoader size={14} className="animate-spin" />}

      <Button
        icon={<IconArrowLeft />}
        type="outline"
        disabled={page <= 1 || isLoading}
        onClick={onPreviousPage}
        title="Previous Page"
        style={{ padding: '3px 10px' }}
      />

      <Button
        icon={<IconArrowRight />}
        type="outline"
        disabled={hasRunOutOfRows || isLoading}
        onClick={onNextPage}
        title="Next Page"
        style={{ padding: '3px 10px' }}
      />
    </div>
  )
}

export default Pagination
