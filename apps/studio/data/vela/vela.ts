import createClient, {
  ClientMethod,
  FetchResponse,
  HeadersOptions,
  InitParam,
  MaybeOptionalInit,
} from 'openapi-fetch'
import { paths } from './vela-schema'
import { VELA_PLATFORM_URL } from '../../pages/api/constants'
import { NextApiRequest } from 'next'
import type { HttpMethod, MediaType, PathsWithMethod } from 'openapi-typescript-helpers'

export interface Client<Paths extends {}, Media extends MediaType = MediaType> {
  get: ClientMethod<Paths, 'get', Media>
  put: ClientMethod<Paths, 'put', Media>
  post: ClientMethod<Paths, 'post', Media>
  delete: ClientMethod<Paths, 'delete', Media>
  options: ClientMethod<Paths, 'options', Media>
  head: ClientMethod<Paths, 'head', Media>
  patch: ClientMethod<Paths, 'patch', Media>
  trace: ClientMethod<Paths, 'trace', Media>
}

const velaClient = createClient<paths>({
  baseUrl: VELA_PLATFORM_URL,
  credentials: 'include',
  redirect: 'follow',
  headers: {
    'Content-Type': 'application/json',
  },
})

const mergeHeaders = (req: NextApiRequest, headers: HeadersOptions[]) => {
  const authorization = req.headers.authorization
  const newHeader = {
    ...headers.reduce((acc, cur) => ({ ...acc, ...cur }), {}),
    ...(authorization ? { Authorization: authorization } : {}),
  }
  return newHeader as HeadersOptions
}

const prepareOptions = (
  req: NextApiRequest,
  init: object | object[],
) => {
  const origOptions = Array.isArray(init) ? init : [init]
  const origHeaders = origOptions
    .filter((x) => x !== undefined && 'headers' in x)
    .map((x) => x?.headers)
    .filter((x) => x !== undefined)

  const headers = mergeHeaders(req, origHeaders)
  const options = origOptions.reduce((acc, cur) => {
    return {
      ...acc,
      ...cur,
    }
  }, {})

  return {
    ...options,
    headers: headers,
  } as any
}

export function getVelaClient(req: NextApiRequest): Client<paths, `${string}/${string}`> {
  return {
    delete<
      Path extends PathsWithMethod<paths, 'delete'>,
      Init extends MaybeOptionalInit<paths[Path], 'delete'>,
    >(
      url: Path,
      ...init: InitParam<Init>
    ): Promise<FetchResponse<paths[Path]['delete'], Init, `${string}/${string}`>> {
      return velaClient.DELETE(url, prepareOptions(req, init))
    },
    get<
      Path extends PathsWithMethod<paths, 'get'>,
      Init extends MaybeOptionalInit<paths[Path], 'get'>,
    >(
      url: Path,
      ...init: InitParam<Init>
    ): Promise<FetchResponse<paths[Path]['get'], Init, `${string}/${string}`>> {
      return velaClient.GET(url, prepareOptions(req, init))
    },
    head<
      Path extends PathsWithMethod<paths, 'head'>,
      Init extends MaybeOptionalInit<paths[Path], 'head'>,
    >(
      url: Path,
      ...init: InitParam<Init>
    ): Promise<FetchResponse<paths[Path]['head'], Init, `${string}/${string}`>> {
      return velaClient.HEAD(url, prepareOptions(req, init))
    },
    options<
      Path extends PathsWithMethod<paths, 'options'>,
      Init extends MaybeOptionalInit<paths[Path], 'options'>,
    >(
      url: Path,
      ...init: InitParam<Init>
    ): Promise<FetchResponse<paths[Path]['options'], Init, `${string}/${string}`>> {
      return velaClient.OPTIONS(url, prepareOptions(req, init))
    },
    patch<
      Path extends PathsWithMethod<paths, 'patch'>,
      Init extends MaybeOptionalInit<paths[Path], 'patch'>,
    >(
      url: Path,
      ...init: InitParam<Init>
    ): Promise<FetchResponse<paths[Path]['patch'], Init, `${string}/${string}`>> {
      return velaClient.PATCH(url, prepareOptions(req, init))
    },
    post<
      Path extends PathsWithMethod<paths, 'post'>,
      Init extends MaybeOptionalInit<paths[Path], 'post'>,
    >(
      url: Path,
      ...init: InitParam<Init>
    ): Promise<FetchResponse<paths[Path]['post'], Init, `${string}/${string}`>> {

      return velaClient.POST(url, prepareOptions(req, init))
    },
    put<
      Path extends PathsWithMethod<paths, 'put'>,
      Init extends MaybeOptionalInit<paths[Path], 'put'>,
    >(
      url: Path,
      ...init: InitParam<Init>
    ): Promise<FetchResponse<paths[Path]['put'], Init, `${string}/${string}`>> {
      return velaClient.PUT(url, prepareOptions(req, init))
    },
    trace<
      Path extends PathsWithMethod<paths, 'trace'>,
      Init extends MaybeOptionalInit<paths[Path], 'trace'>,
    >(
      url: Path,
      ...init: InitParam<Init>
    ): Promise<FetchResponse<paths[Path]['trace'], Init, `${string}/${string}`>> {
      return velaClient.TRACE(url, prepareOptions(req, init))
    },
  }
}

export function setOrganizationCookie(organizationId: number) {
  if (typeof document === 'undefined') return
  document.cookie = `x-vela-organization-id=${organizationId}`
}

export function getOrganizationCookie(req?: NextApiRequest): number {
  let cookie: string | undefined = undefined
  if (typeof document !== 'undefined') {
    const entry = document.cookie
      .split(';')
      .find((c) => c.trim().startsWith('x-vela-organization-id='))
    if (entry) cookie = entry.split('=')[1]
  }
  if (req) {
    cookie = req.cookies['x-vela-organization-id']
  }
  if (!cookie) return -1
  return parseInt(cookie)
}

export function deleteOrganizationCookie() {
  if (typeof document === 'undefined') return
  document.cookie = `x-vela-organization-id=`
}

export function setProjectCookie(projectId: number) {
  if (typeof document === 'undefined') return
  document.cookie = `x-vela-project-id=${projectId}`
}

export function getProjectCookie(req?: NextApiRequest): number {
  let cookie: string | undefined = undefined
  if (typeof document !== 'undefined') {
    const entry = document.cookie.split(';').find((c) => c.trim().startsWith('x-vela-project-id='))
    if (entry) cookie = entry.split('=')[1]
  }
  if (req) {
    cookie = req.cookies['x-vela-project-id']
  }
  if (!cookie) return -1
  return parseInt(cookie)
}

export function deleteProjectCookie() {
  if (typeof document === 'undefined') return
  document.cookie = `x-vela-project-id=`
}
