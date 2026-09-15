/** Input paths are relative to one project root, not registry or repository packaging paths. */
export function normalizeProjectPath(path: string): string | undefined {
  const normalized = path.replace(/\\/g, '/').replace(/^(?:\.\/)+/, '')
  if (
    !normalized ||
    /^(?:\/|[a-z]:)/i.test(normalized) ||
    normalized.includes('\0') ||
    normalized.split('/').some((part) => !part || part === '.' || part === '..')
  ) {
    return undefined
  }
  return normalized
}

export function isTestOrGeneratedPath(path: string): boolean {
  return (
    /(?:^|\/)(?:node_modules|\.next|\.nuxt|dist|build|coverage|__tests__|__mocks__|tests?|fixtures)(?:\/|$)/.test(
      path
    ) ||
    /(?:\.(?:test|spec|stories)|_test|\.d)\.[^/]+$/.test(path) ||
    /(?:^|\/)routeTree\.gen\.[^/]+$/.test(path)
  )
}

export function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}
