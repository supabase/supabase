declare module 'next/router' {
  import type { ParsedUrlQuery } from 'querystring'

  interface UrlObject {
    auth?: string | null | undefined
    hash?: string | null | undefined
    host?: string | null | undefined
    hostname?: string | null | undefined
    href?: string | null | undefined
    pathname?: string | null | undefined
    protocol?: string | null | undefined
    search?: string | null | undefined
    slashes?: boolean | null | undefined
    port?: string | number | null | undefined
    query?: string | null | ParsedUrlQueryInput | undefined
  }

  declare type Url = UrlObject | string

  interface TransitionOptions {
    shallow?: boolean
    locale?: string | false
    scroll?: boolean
  }

  type Handler = (...evts: any[]) => void
  type MittEmitter<T> = {
    on(type: T, handler: Handler): void
    off(type: T, handler: Handler): void
    emit(type: T, ...evts: any[]): void
  }

  declare const routerEvents: readonly [
    'routeChangeStart',
    'beforeHistoryChange',
    'routeChangeComplete',
    'routeChangeError',
    'hashChangeStart',
    'hashChangeComplete',
  ]
  export type RouterEvent = (typeof routerEvents)[number]

  export type NextRouter = {
    isReady: boolean
    get asPath(): string
    route: string
    pathname: string
    basePath: string

    query: ParsedUrlQuery

    /**
     * Performs a `pushState` with arguments
     * @param url of the route
     * @param as masks `url` for the browser
     * @param options object you can define `shallow` and other options
     */
    push(url: Url, as?: Url, options?: TransitionOptions): Promise<boolean>

    events: MittEmitter<RouterEvent>
  }

  export function useRouter(): NextRouter
}
