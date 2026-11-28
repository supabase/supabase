/**
 * Logflare connection details for the self-hosted log drain routes, read from the environment at
 * call time. Returns a 500 `Response` naming the missing env vars when either is unset.
 *
 * _Only call this from server-side self-hosted code._
 */
export function getLogflareConfig() {
  const { LOGFLARE_PRIVATE_ACCESS_TOKEN: token, LOGFLARE_URL: baseUrl } = process.env
  if (!token || !baseUrl) {
    const missingEnvVars = [
      token ? null : 'LOGFLARE_PRIVATE_ACCESS_TOKEN',
      baseUrl ? null : 'LOGFLARE_URL',
    ].filter(Boolean)
    return Response.json(
      { error: { message: `${missingEnvVars.join(', ')} env variables are not set` } },
      { status: 500 }
    )
  }

  return {
    /** A Logflare API URL with `pathname` set via `URL.pathname`, so route params stay in the path. */
    url: (pathname: string) => {
      const url = new URL(baseUrl)
      url.pathname = pathname
      return url
    },
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  }
}
