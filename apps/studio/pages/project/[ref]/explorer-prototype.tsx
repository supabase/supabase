import { ExplorerPrototype } from '@/components/interfaces/ExplorerPrototype/ExplorerPrototype'
import { ExplorerPrototypeProvider } from '@/components/interfaces/ExplorerPrototype/ExplorerPrototypeContext'
import { ExplorerSidebarMenu } from '@/components/interfaces/ExplorerPrototype/ExplorerSidebar'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from '@/components/layouts/ProjectLayout'
import type { NextPageWithLayout } from '@/types'

/**
 * Throwaway reference prototype for the Explorer / Notebooks initiative.
 *
 * Uses the same project chrome as the SQL editor (`DefaultLayout` →
 * `ProjectLayoutWithAuth` with a resizable `productMenu`). It does not go
 * through `EditorBaseLayout`, because that layout renders the existing editor
 * tabs; the Explorer brings its own resource-typed tab
 * strip, which is exactly the swap PR E3 makes behind the `explorer` flag.
 *
 * Mock data only — nothing reaches a project.
 */
const ExplorerPrototypePage: NextPageWithLayout = () => <ExplorerPrototype />

ExplorerPrototypePage.getLayout = (page) => (
  <DefaultLayout>
    <ExplorerPrototypeProvider>
      <ProjectLayoutWithAuth
        resizableSidebar
        product="Explorer"
        productMenu={<ExplorerSidebarMenu />}
      >
        {page}
      </ProjectLayoutWithAuth>
    </ExplorerPrototypeProvider>
  </DefaultLayout>
)

export default ExplorerPrototypePage
