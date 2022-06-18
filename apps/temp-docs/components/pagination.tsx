import Link from 'next/link'
import { useRouter } from 'next/router'

const pagination = () => {
  const router = useRouter()
  const Page: any = router.query.page || 1
  const page = parseInt(Page)
  return (
    <ul className="flex justify-center space-x-1 text-xs font-medium">
      <li>
        <Link href="/discussions?page=1">
          <a className="inline-flex h-8 w-8 items-center justify-center rounded border border-scale-600 bg-scale-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </a>
        </Link>
      </li>
      {[1, 2, 3, 4, 5].map((element: any, i: number) => {
        i = i + 1
        return (
          <li key={i}>
            <Link href={`/discussions?page=${i}`}>
              <a className={`inline-flex h-8 w-8 items-center justify-center rounded border border-scale-600 ${page === i ? "bg-brand-900" : "bg-scale-300"}`}>
                {i}
              </a>
            </Link>
          </li>
        )
      })}
      <li>
        <Link href="/discussions?page=1">
          <a className="inline-flex h-8 w-8 items-center justify-center rounded border border-scale-600 bg-scale-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </a>
        </Link>
      </li>
    </ul>
  )
}

export default pagination
