import { useLocation, useParams, useSearchParams, useNavigate } from '@remix-run/react'
import { BASE_PATH } from 'lib/constants'
import { NextRouter } from 'next/router'
import { parse } from 'querystring'
import { useMemo } from 'react'

export function useRouter(): NextRouter {
  const params = useParams()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  const query = useMemo(() => {
    let q: { [key: string]: string | string[] | undefined } = Object.fromEntries(
      Array.from(new Set(searchParams.keys())).map((key) => {
        const values = searchParams.getAll(key)
        return [key, values.length > 1 ? values : values[0]]
      })
    )

    q = { ...q, ...params }

    return q
  }, [params, searchParams])

  return {
    query,
    isReady: true,
    route: '',
    pathname: location.pathname,
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

      navigate(to)

      return Promise.resolve(true)
    },
    replace(url, _as, options) {
      const to =
        typeof url === 'string'
          ? url
          : {
              hash: url.hash ?? undefined,
              pathname: url.pathname ?? undefined,
              search: url.search ?? undefined,
            }

      // TODO: handle url.query

      navigate(to, { replace: true })

      return Promise.resolve(true)
    },
    events: { emit(type, ...evts) {}, off(type, handler) {}, on(type, handler) {} },
  }
}
