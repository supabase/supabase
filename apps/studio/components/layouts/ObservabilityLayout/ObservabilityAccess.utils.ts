import { IS_PLATFORM } from '@/lib/constants'

type ObservabilityAccessOptions = {
  isPlatform?: boolean
  reportsAll?: boolean
}

export function canAccessObservability({
  isPlatform = IS_PLATFORM,
  reportsAll = false,
}: ObservabilityAccessOptions): boolean {
  return !isPlatform || reportsAll
}

export function getObservabilityEntryRoute(
  ref: string | undefined,
  options?: { isPlatform?: boolean }
): string {
  const isPlatform = options?.isPlatform ?? IS_PLATFORM
  const baseRoute = `/project/${ref}/observability`

  return isPlatform ? baseRoute : `${baseRoute}/query-performance`
}
