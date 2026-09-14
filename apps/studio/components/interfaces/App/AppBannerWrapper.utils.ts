// Anchored to the section root so per-resource log pages (e.g. a single edge
// function's logs) don't pull the banner outside Logs/Observability.
const LOGS_SECTION_PATH = /^\/project\/[^/]+\/(logs|observability)(\/|$)/

export function isLogsOrObservabilityPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return LOGS_SECTION_PATH.test(pathname)
}
