/**
 * [Charis 2024-04-24]
 * Temporarily turned off because it breaks the navigation back from the
 * reference pages. Can turn this back on after we have completed the entire
 * App Router migration.
 *
 * A catch-all to redirect all not-found pages.
 *
 * This allows us to generate recommendations based on the path the user is
 * looking for, which isn't possible with a regular 404 page (receives no
 * params).
 */

import { redirect } from 'next/navigation'
import { notFoundLink } from '~/features/recommendations/NotFound.utils'

type Params = { slug: string[] }

const CatchAllPage = async ({ params }: { params: Params }) => {
  redirect(notFoundLink(params.slug.join('/')))
}

export default CatchAllPage
