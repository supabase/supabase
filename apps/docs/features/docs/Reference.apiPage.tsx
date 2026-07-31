import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import { reference_api } from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { ClientLibIntroduction } from '~/features/docs/Reference.introduction'
import { ReferenceNavigation } from '~/features/docs/Reference.navigation'
import { ReferenceContentScrollHandler } from '~/features/docs/Reference.navigation.client'
import { RefSection } from '~/features/docs/Reference.sections'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'

export async function ApiReferencePage({ sectionSlug }: { sectionSlug?: string }) {
  const isIndexOrIntro = !sectionSlug || sectionSlug === 'introduction'

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
            {isIndexOrIntro ? (
              <ClientLibIntroduction
                libPath="api"
                version="latest"
                isLatestVersion={true}
                className="max-w-[unset]"
              />
            ) : (
              <RefSection libraryId="api" version="latest" slug={sectionSlug} />
            )}
          </article>
        </LayoutMainContent>
      </SidebarSkeleton>
    </ReferenceContentScrollHandler>
  )
}
