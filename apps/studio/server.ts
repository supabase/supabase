// wrapFetchWithSentry only adds a span, trace meta tags, and a flush. errors
// are captured in start.ts, because only the sentry middleware sees handler throws.
import './instrument.server.mjs'

import { wrapFetchWithSentry } from '@sentry/tanstackstart-react'
import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server'
import { createServerEntry, type ServerEntry } from '@tanstack/react-start/server-entry'

import { toCdnAssetUrl } from './asset-cdn'

// Inlined by vite.config.ts so the document (prerendered `_shell.html`) and the
// client bundle's `renderBuiltUrl` always agree on the CDN base.
declare const __STUDIO_ASSET_CDN_URL__: string | undefined

const assetCdnUrl = __STUDIO_ASSET_CDN_URL__
const basePath = process.env.NEXT_PUBLIC_BASE_PATH

const handler = createStartHandler({
  handler: defaultStreamHandler,
  ...(assetCdnUrl && {
    transformAssets: ({ url, kind }) => {
      const href = toCdnAssetUrl(url, assetCdnUrl, basePath)
      // Cross-origin module scripts need CORS, and it also keeps error
      // details (not just "Script error.") visible to Sentry.
      if (href === url || kind === 'css-url') return { href }
      return { href, crossOrigin: 'anonymous' }
    },
  }),
})

const requestHandler: ServerEntry = wrapFetchWithSentry({
  fetch(request: Request) {
    return handler(request)
  },
})

// eslint-disable-next-line no-restricted-exports
export default createServerEntry(requestHandler)
