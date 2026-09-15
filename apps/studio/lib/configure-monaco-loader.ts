import { loader } from '@monaco-editor/react'

import { BASE_PATH, IS_PLATFORM } from '@/lib/constants'

// [Ivan] Serve the Monaco assets locally from the public folder for self-hosted deployments, but use the CDN for
// the platform deployment to reduce bundle size and improve caching.
//
// Shared by both runtime entry points — `pages/_app.tsx` (Next) and
// `routes/__root.tsx` (TanStack) — so the asset path can't drift between them.
export function configureMonacoLoader() {
  if (typeof window !== 'undefined') {
    loader.config({
      paths: {
        vs: IS_PLATFORM
          ? 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.2/min/vs'
          : `${BASE_PATH}/monaco-editor/vs`,
      },
    })
  }
}
