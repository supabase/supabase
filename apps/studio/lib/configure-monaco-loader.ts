import { loader } from '@monaco-editor/react'

import { BASE_PATH } from '@/lib/constants'

// [Ivan] Serve the Monaco assets locally from the public folder (see #47182, which
// dropped CDN loading in every environment and re-nested the assets under `vs/`). The
// worker bootstrap (vs/base/worker/workerMain.js) loads the language workers (e.g.
// tsWorker.js) via fetch() from inside the web worker. A root-relative path fails to
// resolve there in some browsers (Firefox throws "... is not a valid URL"), so we point
// `vs` at an absolute URL including the origin. Guarded on `window` since callers are
// also evaluated during SSR (where `window` is undefined and there's no editor to mount).
//
// Shared by both runtime entry points — `pages/_app.tsx` (Next) and
// `routes/__root.tsx` (TanStack) — so the asset path can't drift between them.
export function configureMonacoLoader() {
  if (typeof window !== 'undefined') {
    loader.config({ paths: { vs: `${window.location.origin}${BASE_PATH}/monaco-editor/vs` } })
  }
}
