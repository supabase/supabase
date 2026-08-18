import { test as base } from '@playwright/test'

import { isSupabaseHost } from './hosts.ts'

export { expect } from '@playwright/test'

// extraHTTPHeaders would send the secret on every request, including third-party ones.
export const test = base.extend({
  context: async ({ context, baseURL }, use) => {
    const secret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
    if (secret && baseURL && isSupabaseHost(baseURL)) {
      const origin = new URL(baseURL).origin
      await context.route(
        (url) => url.origin === origin,
        async (route) => {
          await route.continue({
            headers: {
              ...route.request().headers(),
              'x-vercel-protection-bypass': secret,
              'x-vercel-set-bypass-cookie': 'true',
            },
          })
        }
      )
    }
    await use(context)
  },
})
