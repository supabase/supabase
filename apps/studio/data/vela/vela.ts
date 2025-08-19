import createClient, {
  Client,
  FetchResponse,
  HeadersOptions,
  InitParam,
  MaybeOptionalInit,
} from 'openapi-fetch'
import { paths } from './vela-schema'
import { VELA_PLATFORM_URL } from '../../pages/api/constants'
import { NextApiRequest } from 'next'
import type { PathsWithMethod } from 'openapi-typescript-helpers'

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

export function getVelaClient(
  req: NextApiRequest
): Omit<Omit<Client<paths, `${string}/${string}`>, 'eject'>, 'use'> {

  return {
    DELETE<
      Path extends PathsWithMethod<paths, 'delete'>,
      Init extends MaybeOptionalInit<paths[Path], 'delete'>,
    >(
      url: Path,
      ...init: InitParam<Init>
    ): Promise<FetchResponse<paths[Path]['delete'], Init, `${string}/${string}`>> {
      const origHeaders = init
        .filter((x) => x !== undefined && 'headers' in x)
        .map((x) => x?.headers)
        .filter((x) => x !== undefined)

      const headers = mergeHeaders(req, origHeaders)
      return velaClient.DELETE(url, {
        ...init,
        headers: headers,
      } as any)
    },
    GET<
      Path extends PathsWithMethod<paths, 'get'>,
      Init extends MaybeOptionalInit<paths[Path], 'get'>,
    >(
      url: Path,
      ...init: InitParam<Init>
    ): Promise<FetchResponse<paths[Path]['get'], Init, `${string}/${string}`>> {
      const origHeaders = init
        .filter((x) => x !== undefined && 'headers' in x)
        .map((x) => x?.headers)
        .filter((x) => x !== undefined)

      const headers = mergeHeaders(req, origHeaders)
      return velaClient.GET(url, {
        ...init,
        headers: headers,
      } as any)
    },
    HEAD<
      Path extends PathsWithMethod<paths, 'head'>,
      Init extends MaybeOptionalInit<paths[Path], 'head'>,
    >(
      url: Path,
      ...init: InitParam<Init>
    ): Promise<FetchResponse<paths[Path]['head'], Init, `${string}/${string}`>> {
      const origHeaders = init
        .filter((x) => x !== undefined && 'headers' in x)
        .map((x) => x?.headers)
        .filter((x) => x !== undefined)

      const headers = mergeHeaders(req, origHeaders)
      return velaClient.HEAD(url, {
        ...init,
        headers: headers,
      } as any)
    },
    OPTIONS<
      Path extends PathsWithMethod<paths, 'options'>,
      Init extends MaybeOptionalInit<paths[Path], 'options'>,
    >(
      url: Path,
      ...init: InitParam<Init>
    ): Promise<FetchResponse<paths[Path]['options'], Init, `${string}/${string}`>> {
      const origHeaders = init
        .filter((x) => x !== undefined && 'headers' in x)
        .map((x) => x?.headers)
        .filter((x) => x !== undefined)

      const headers = mergeHeaders(req, origHeaders)
      return velaClient.OPTIONS(url, {
        ...init,
        headers: headers,
      } as any)
    },
    PATCH<
      Path extends PathsWithMethod<paths, 'patch'>,
      Init extends MaybeOptionalInit<paths[Path], 'patch'>,
    >(
      url: Path,
      ...init: InitParam<Init>
    ): Promise<FetchResponse<paths[Path]['patch'], Init, `${string}/${string}`>> {
      const origHeaders = init
        .filter((x) => x !== undefined && 'headers' in x)
        .map((x) => x?.headers)
        .filter((x) => x !== undefined)

      const headers = mergeHeaders(req, origHeaders)
      return velaClient.PATCH(url, {
        ...init,
        headers: headers,
      } as any)
    },
    POST<
      Path extends PathsWithMethod<paths, 'post'>,
      Init extends MaybeOptionalInit<paths[Path], 'post'>,
    >(
      url: Path,
      ...init: InitParam<Init>
    ): Promise<FetchResponse<paths[Path]['post'], Init, `${string}/${string}`>> {
      const origHeaders = init
        .filter((x) => x !== undefined && 'headers' in x)
        .map((x) => x?.headers)
        .filter((x) => x !== undefined)

      const headers = mergeHeaders(req, origHeaders)
      return velaClient.POST(url, {
        ...init,
        headers: headers,
      } as any)
    },
    PUT<
      Path extends PathsWithMethod<paths, 'put'>,
      Init extends MaybeOptionalInit<paths[Path], 'put'>,
    >(
      url: Path,
      ...init: InitParam<Init>
    ): Promise<FetchResponse<paths[Path]['put'], Init, `${string}/${string}`>> {
      const origHeaders = init
        .filter((x) => x !== undefined && 'headers' in x)
        .map((x) => x?.headers)
        .filter((x) => x !== undefined)

      const headers = mergeHeaders(req, origHeaders)
      return velaClient.PUT(url, {
        ...init,
        headers: headers,
      } as any)
    },
    TRACE<
      Path extends PathsWithMethod<paths, 'trace'>,
      Init extends MaybeOptionalInit<paths[Path], 'trace'>,
    >(
      url: Path,
      ...init: InitParam<Init>
    ): Promise<FetchResponse<paths[Path]['trace'], Init, `${string}/${string}`>> {
      const origHeaders = init
        .filter((x) => x !== undefined && 'headers' in x)
        .map((x) => x?.headers)
        .filter((x) => x !== undefined)

      const headers = mergeHeaders(req, origHeaders)
      return velaClient.TRACE(url, {
        ...init,
        headers: headers,
      } as any)
    },
  }
}

export function mustOrganizationId(req: NextApiRequest): number {
  const fromCookie = getOrganizationCookie(req)
  if (fromCookie !== -1) return fromCookie

  const header = req.headers['X-Vela-Organization-Id']
  if (!header) {
    throw new Error('Organization id not found')
  }

  if (typeof header !== 'string') {
    throw new Error('Organization id is not a string')
  }

  try {
    return parseInt(header)
  } catch (e) {
    throw new Error('Organization id is not a number')
  }
}

export function mustProjectId(req: NextApiRequest): number {
  const fromCookie = getProjectCookie(req)
  if (fromCookie !== -1) return fromCookie

  const header = req.headers['X-Vela-Project-Id']
  if (!header) {
    throw new Error('Project id not found')
  }

  if (typeof header !== 'string') {
    throw new Error('Project id is not a string')
  }

  try {
    console.log('header', header)
    return parseInt(header)
  } catch (e) {
    throw new Error('Project id is not a number')
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
