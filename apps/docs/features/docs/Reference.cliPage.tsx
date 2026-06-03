import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import { reference_cli } from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { ClientLibIntroduction } from '~/features/docs/Reference.introduction'
import { ReferenceNavigation } from '~/features/docs/Reference.navigation'
import { ReferenceContentScrollHandler } from '~/features/docs/Reference.navigation.client'
import { RefSections } from '~/features/docs/Reference.sections'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'

export async function CliReferencePage() {
  return (
    <ReferenceContentScrollHandler libPath="cli" version="latest" isLatestVersion={true}>
      <SidebarSkeleton
        menuId={MenuId.RefCli}
        NavigationMenu={
          <ReferenceNavigation
            libraryId="cli"
            name="Supabase CLI"
            menuData={reference_cli}
            libPath="cli"
            version="latest"
            isLatestVersion={true}
          />
        }
      >
        <LayoutMainContent>
          <article className="@container/article">
            <ClientLibIntroduction
              libPath="cli"
              version="latest"
              isLatestVersion={true}
              className="max-w-[unset]"
            />
            <RefSections libraryId="cli" version="latest" />
          </article>
        </LayoutMainContent>
      </SidebarSkeleton>
    </ReferenceContentScrollHandler>
  )
}
