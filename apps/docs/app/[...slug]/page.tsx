/**
 * A catch-all to redirect all not found pages.
 *
 * This allows us to generate recommendations based on the path the user is
 * looking for, which isn't possible with a regular 404 page (receives no
 * params).
 */

import { redirect } from 'next/navigation'
import { sep } from 'node:path'

const CatchAllPage = async ({ params }: { params: { slug: string[] } }) => {
  const searchParams = new URLSearchParams({ page: encodeURIComponent(params.slug.join(sep)) })
  redirect(`/not-found?${searchParams}`)
}

export default CatchAllPage
