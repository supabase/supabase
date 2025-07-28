import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import { reference_api } from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { ClientLibIntroduction } from '~/features/docs/Reference.introduction'
import { ReferenceNavigation } from '~/features/docs/Reference.navigation'
import { ReferenceContentScrollHandler } from '~/features/docs/Reference.navigation.client'
import { RefSections } from '~/features/docs/Reference.sections'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'

export async function ApiReferencePage() {
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
