import { createRouter } from '@tanstack/react-router'

import { routeTree } from './routeTree.gen'
import { withBasePath } from '@/lib/base-path'

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultNotFoundComponent: () => (
      <div className="mx-auto flex max-w-md flex-col items-center gap-2 py-32 text-center">
        <h1 className="text-2xl font-medium">Page not found</h1>
        <p className="text-foreground-light">That example doesn’t exist or has moved.</p>
        <a href={withBasePath('/')} className="mt-4 text-brand-600 underline underline-offset-4">
          Back to all examples
        </a>
      </div>
    ),
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
