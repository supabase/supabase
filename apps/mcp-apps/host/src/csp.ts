/**
 * Builds the Content Security Policy a view runs under from its resource's
 * `_meta.ui.csp`, the way MCP Apps hosts do: nothing beyond inline code unless
 * the resource declares an origin. Catches assets a real host would block.
 */
export interface ResourceCsp {
  connectDomains?: string[]
  resourceDomains?: string[]
  frameDomains?: string[]
}

const sources = (domains: string[] | undefined) =>
  (domains ?? []).filter((domain) => /^https?:\/\/[^\s;'"]+$/.test(domain)).join(' ')

export function buildCsp(csp: ResourceCsp | undefined) {
  const resource = sources(csp?.resourceDomains)
  const connect = sources(csp?.connectDomains)
  const frame = sources(csp?.frameDomains)
  return [
    "default-src 'none'",
    `script-src 'unsafe-inline' ${resource}`.trim(),
    `style-src 'unsafe-inline' ${resource}`.trim(),
    `img-src data: blob: ${resource}`.trim(),
    `font-src data: ${resource}`.trim(),
    `media-src data: blob: ${resource}`.trim(),
    `connect-src ${connect || "'none'"}`,
    `frame-src ${frame || "'none'"}`,
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ')
}

/** Puts the policy first in the document so it governs every later element. */
export function withCsp(html: string, csp: ResourceCsp | undefined) {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${buildCsp(csp).replaceAll('"', '&quot;')}">`
  return /<head[^>]*>/i.test(html)
    ? html.replace(/<head[^>]*>/i, (head) => `${head}${meta}`)
    : `${meta}${html}`
}
