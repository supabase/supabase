import { EnumeratedTypesPage } from 'components/interfaces/Database'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import type { NextPageWithLayout } from 'types'

/**
 * Catch-all route for nested database type actions (e.g., /types/new, /types/edit/123)
 *
 * This page renders the same content as the parent /types page by using a shared component.
 * The useNestedRoute hook detects the URL path and opens the appropriate side panel.
 *
 * This is necessary because Next.js requires an actual page file to exist to avoid 404 errors
 * when users navigate directly to these URLs via browser address bar or bookmarks.
 */
const DatabaseEnumeratedTypesAction: NextPageWithLayout = () => {
  return <EnumeratedTypesPage />
}

DatabaseEnumeratedTypesAction.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseEnumeratedTypesAction
