import { env } from '../env.config'

export function toUrl(path: `/${string}`) {
  return `${env.STUDIO_URL}${path}`
}
