import { A, Head, Html, Meta, Routes, Scripts } from '@solidjs/start'
import layout from './layout'

/**
 * Root layout component.
 *
 * The `load` export is SolidStart's data loader convention — it runs on
 * both server and client during hydration. For auth-sensitive data we
 * delegate to a server$ function (see src/routes/layout.ts) so the
 * Supabase server client never ships to the browser.
 */
export function Base() {
  return (
    <Html lang="en">
      <Head>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>SolidStart + Supabase SSR</title>
      </Head>
      <body>
        <Routes />
        <Scripts />
      </body>
    </Html>
  )
}

export default Base

export const load = layout
