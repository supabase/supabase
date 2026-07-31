import { notFound } from 'next/navigation'

import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import { reference_api } from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { getSectionsBySlug } from '~/features/docs/Reference.generated.singleton'
import { ClientLibIntroduction } from '~/features/docs/Reference.introduction'
import { ReferenceNavigation } from '~/features/docs/Reference.navigation'
import { ReferenceContentScrollHandler } from '~/features/docs/Reference.navigation.client'
import { RefSections, SectionSwitch } from '~/features/docs/Reference.sections'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'

export async function ApiReferencePage({ path }: { path: Array<string> }) {
  const operationSlug = path[0]

  if (operationSlug) {
    return <ApiOperationPage operationSlug={operationSlug} />
  }

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
            <ClientLibIntroduction
              libPath="api"
              version="latest"
              isLatestVersion={true}
              className="max-w-[unset]"
            />
            <RefSections libraryId="api" version="latest" />
          </article>
        </LayoutMainContent>
      </SidebarSkeleton>
    </ReferenceContentScrollHandler>
  )
}

// Spike (DOCS-1268): one endpoint per page, reusing the same SectionSwitch
// (and therefore the same ApiEndpointSection/MarkdownSection) the monolith
// above renders every operation through — no rendering logic is duplicated.
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
