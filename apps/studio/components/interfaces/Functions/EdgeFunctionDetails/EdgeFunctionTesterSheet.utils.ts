export interface EdgeFunctionTestHeaderRow {
  key: string
  value: string
}

interface BuildEdgeFunctionTestHeadersParams {
  /**
   * Publishable (or legacy anon) key sent on the `apikey` header. New format API keys are not
   * JWTs, so they must never be sent as a bearer token on `Authorization`.
   */
  apiKey?: string
  /** Header rows entered by the user in the tester's "Headers" section. */
  customHeaders: EdgeFunctionTestHeaderRow[]
}

/**
 * Builds the headers forwarded to the edge function.
 *
 * `Authorization` is deliberately never generated here: it is only ever set by the user, either by
 * typing a header row or by picking a role in the impersonation popover (which prefills a row).
 *
 * Header names are case insensitive, so rows are merged on their lowercased name to make sure a row
 * typed as `apikey` cannot end up alongside a generated `Apikey` and get comma joined by `fetch`.
 * User rows are applied last and win over the generated defaults.
 */
export const buildEdgeFunctionTestHeaders = ({
  apiKey,
  customHeaders,
}: BuildEdgeFunctionTestHeadersParams): Record<string, string> => {
  const headers = new Map<string, { name: string; value: string }>()

  const set = (name: string, value: string) => {
    headers.set(name.toLowerCase(), { name, value })
  }

  set('Content-Type', 'application/json')
  if (apiKey) set('apikey', apiKey)

  customHeaders.forEach(({ key, value }) => {
    const name = key.trim()
    if (name.length === 0 || value.length === 0) return
    set(name, value)
  })

  return Object.fromEntries([...headers.values()].map(({ name, value }) => [name, value]))
}
