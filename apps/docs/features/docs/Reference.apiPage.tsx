import { notFound, redirect } from 'next/navigation'

import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import { reference_api } from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { getSectionsBySlug } from '~/features/docs/Reference.generated.singleton'
import { ReferenceNavigation } from '~/features/docs/Reference.navigation'
import { ReferenceContentScrollHandler } from '~/features/docs/Reference.navigation.client'
import { SectionSwitch } from '~/features/docs/Reference.sections'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'

export async function ApiReferencePage({ path }: { path: Array<string> }) {
  const operationSlug = path[0]

  if (!operationSlug) {
    redirect('/reference/api/introduction')
  }

  return <ApiOperationPage operationSlug={operationSlug} />
}

// DOCS-1268: one endpoint per page, reusing the same SectionSwitch (and
// therefore the same ApiEndpointSection/MarkdownSection) that used to render
// every operation on the single monolithic /reference/api page.
async function ApiOperationPage({ operationSlug }: { operationSlug: string }) {
  const sectionsBySlug = await getSectionsBySlug('api', 'latest')
  const section = sectionsBySlug?.get(operationSlug)
  if (!section) notFound()

  return (
    <ReferenceContentScrollHandler libPath="api" version="latest" isLatestVersion={true}>
      <SidebarSkeleton
        menuId={MenuId.RefApi}
        NavigationMenu={
          <ReferenceNavigation
            libraryId="api"
            name="Management API"
            menuData={reference_api}
            libPath="api"
            version="latest"
            isLatestVersion={true}
            realNavigation
          />
        }
      >
        <LayoutMainContent>
          <article className="@container/article">
            <SectionSwitch libraryId="api" version="latest" section={section} />
          </article>
        </LayoutMainContent>
      </SidebarSkeleton>
    </ReferenceContentScrollHandler>
  )
}
