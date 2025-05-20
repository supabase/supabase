import { getStudioUrl } from '../env.config'

export function toUrl(path: `/${string}`) {
  return `${getStudioUrl()}${path}`
}
