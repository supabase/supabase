import { env } from '../env.config.js'

export function toUrl(path: `/${string}`) {
  return `${env.STUDIO_URL}${path}`
}
