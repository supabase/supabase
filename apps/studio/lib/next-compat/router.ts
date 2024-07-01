import { useParams } from '@remix-run/react'
import { BASE_PATH } from 'lib/constants'
import { NextRouter } from 'next/router'
import { parse } from 'querystring'

export function useRouter(): NextRouter {
  const params = useParams()
  // const [searchParams] = useSearchParams()
  // const navigate = useNavigate()

  return {
    query: params,
    isReady: true,
    route: '',
    pathname: '',
    basePath: BASE_PATH,
    get asPath() {
      return ''
    },
    push(url, _as, options) {
      const to =
        typeof url === 'string'
          ? url
          : {
              hash: url.hash ?? undefined,
              pathname: url.pathname ?? undefined,
              search: url.search ?? undefined,
            }

      // TODO: handle url.query

      // navigate(to)

      return Promise.resolve(true)
    },
    events: { emit(type, ...evts) {}, off(type, handler) {}, on(type, handler) {} },
  }
}
