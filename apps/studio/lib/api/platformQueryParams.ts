import { NextApiRequest } from 'next'

export interface PlatformQueryParams {
  slug?: string
  ref?: string
}

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

export function getPlatformQueryParams<K extends keyof PlatformQueryParams = never>(
  req: NextApiRequest,
  ...required: K[]
): WithRequired<PlatformQueryParams, K> {
  const params = req.query as WithRequired<PlatformQueryParams, K>

  for (const key of required) {
    if (params[key] === undefined) {
      throw new Error(`Missing required query param: ${key}`)
    }
  }
  return params
}
