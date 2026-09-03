export const ASSISTANT_OAUTH_COMPLETE_TYPE = 'assistant-oauth-complete'

export function oauthCallbackTargetOrigin(returnTo: string | null): string | null {
  if (!returnTo) return null
  try {
    return new URL(returnTo).origin
  } catch {
    return null
  }
}

export function buildOAuthCallbackHtml({
  orgSlug,
  returnTo,
}: {
  orgSlug: string
  returnTo: string | null
}): string {
  const targetOrigin = oauthCallbackTargetOrigin(returnTo)
  const payload = jsonForScript({
    type: ASSISTANT_OAUTH_COMPLETE_TYPE,
    org_slug: orgSlug,
  })
  const targetOriginJson = jsonForScript(targetOrigin ?? '')
  const returnHref =
    returnTo && targetOrigin ? `<p><a href="${escapeHtml(returnTo)}">Back to Studio</a></p>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Organization connected</title>
</head>
<body>
  <p>Organization connected. You can close this window.</p>
  ${returnHref}
  <script>
    (function () {
      var payload = ${payload};
      var targetOrigin = ${targetOriginJson};
      if (window.opener && targetOrigin) {
        window.opener.postMessage(payload, targetOrigin);
      }
      window.close();
    })();
  </script>
</body>
</html>`
}

/**
 * Shown instead of the success page when the consented organization does not
 * own the conversation's project. Stays open (no `window.close()`) so the
 * developer can read why; Studio's popup listener never receives the
 * completion message and keeps showing the connect banner.
 */
export function buildOAuthMismatchHtml({
  expectedSlug,
  connectedSlugs,
  managementApiUrl,
  returnTo,
}: {
  expectedSlug: string
  connectedSlugs: string[]
  managementApiUrl: string
  returnTo: string | null
}): string {
  const apiHost = new URL(managementApiUrl).host
  const targetOrigin = oauthCallbackTargetOrigin(returnTo)
  const returnHref =
    returnTo && targetOrigin ? `<p><a href="${escapeHtml(returnTo)}">Back to Studio</a></p>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Wrong organization</title>
</head>
<body>
  <h1>This organization does not own the project</h1>
  <p>Studio opened this conversation for organization <code>${escapeHtml(expectedSlug)}</code>,
  but you authorized <code>${escapeHtml(connectedSlugs.join(', '))}</code> on
  <code>${escapeHtml(apiHost)}</code>. Nothing was saved.</p>
  <p>The assistant's OAuth app, Management API and MCP server must belong to the same
  platform as the Studio you are using. Either connect the organization that owns this
  project, or point <code>MANAGEMENT_API_URL</code> (and the OAuth app) at the platform
  Studio talks to, then try again.</p>
  ${returnHref}
</body>
</html>`
}

function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c')
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}
