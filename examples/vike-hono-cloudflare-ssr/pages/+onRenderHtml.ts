import type { OnRenderHtmlAsync } from 'vike/types'
import { escapeInject, dangerouslySkipEscape } from 'vike/server'

export const onRenderHtml: OnRenderHtmlAsync = async (pageContext) => {
  const { Page, pageProps, responseCookies } = pageContext

  // Render your page component
  const pageHtml = `<div id="page">${Page ? renderToString(<Page {...pageProps} />) : ''}</div>`

  const documentHtml = escapeInject`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Vike + Hono + Supabase SSR</title>
      </head>
      <body>
        ${dangerouslySkipEscape(pageHtml)}
        <script type="module" src="/client/app.js"></script>
      </body>
    </html>`

  // Return response with cookies
  return {
    documentHtml,
    httpResponse: {
      headers: responseCookies ? responseCookies.map(cookie => ['Set-Cookie', cookie]) : []
    }
  }
}

// Simple render function - replace with your preferred rendering library
function renderToString(component: any): string {
  // This is a placeholder - use your actual rendering logic
  // For React: ReactDOMServer.renderToString(component)
  // For Vue: renderToString(component)
  // For Solid: renderToString(() => component)
  return JSON.stringify(component)
}
