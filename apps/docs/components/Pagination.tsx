import Link from 'next/link'
import { IconArrowLeft, IconArrowRight } from 'ui'

const Pagination = ({ currentPage, totalCount }: { currentPage: number; totalCount: number }) => {
  // TODO: not sure if this is the most efficient way to do this. may need to refactor.
  const totalArray = Array.from({ length: totalCount }, (_, i: number) => i + 1)
  const pages = totalArray.filter((page: number) => {
    return page >= currentPage - 2 && page <= currentPage + 2
  })

  return (
    <ul className="flex justify-center space-x-1 text-xs font-medium">
      <li>
        <Link
          href={`/discussions?page=${currentPage - 1}`}
          className="border border-control bg-surface-100 inline-flex h-8 w-8 items-center justify-center rounded"
        >
          <IconArrowLeft className="stroke-2 transition group-hover:-translate-x-1" height={12.5} />
        </Link>
      </li>
      {pages.map((page: number, i: number) => {
        i = i + 1
        return (
          <li key={i}>
            <Link
              href={`/discussions?page=${page}`}
              className={`border-scale-600 inline-flex h-8 w-8 items-center justify-center rounded border ${
                currentPage === page ? 'bg-brand' : 'bg-surface-100'
              }`}
            >
              {page}
            </Link>
          </li>
        )
      })}
      <li>
        <Link
          href={`/discussions?page=${currentPage + 1}`}
          className="border-control bg-surface-100 inline-flex h-8 w-8 items-center justify-center rounded border"
        >
          <IconArrowRight
            className="stroke-2 transition group-hover:-translate-x-1"
            height={12.5}
          />
        </Link>
      </li>
    </ul>
  )
}

export default Pagination
