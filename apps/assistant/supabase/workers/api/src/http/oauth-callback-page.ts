function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c')
}

export function buildOAuthCodeHtml({
  code,
  state,
  returnTo,
}: {
  code: string
  state: string
  returnTo: string
}) {
  const payload = jsonForScript({ type: 'assistant-oauth-code', code, state })
  const origin = jsonForScript(new URL(returnTo).origin)
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>Connect organization</title>
    <p>Return to the Studio window where you started this connection.</p>
    <script>if (window.opener) window.opener.postMessage(${payload}, ${origin});</script></html>`
}
