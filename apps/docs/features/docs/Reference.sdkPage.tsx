import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import * as NavItems from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { REFERENCES } from '~/content/navigation.references'
import { getSectionsBySlug } from '~/features/docs/Reference.generated.singleton'
import { ClientLibHeader } from '~/features/docs/Reference.header'
import { ClientLibIntroduction, OldVersionAlert } from '~/features/docs/Reference.introduction'
import { ClientSdkNavigation } from '~/features/docs/Reference.navigation'
import { ReferenceContentScrollHandler } from '~/features/docs/Reference.navigation.client'
import { ClientLibRefSections, SectionSwitch } from '~/features/docs/Reference.sections'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'

type ClientSdkReferenceProps = {
  sdkId: string
  libVersion: string
} & (
  | { isCrawlerPage?: false; requestedSection?: string }
  | { isCrawlerPage: true; requestedSection: string }
)

export async function ClientSdkReferencePage({ sdkId, libVersion }: ClientSdkReferenceProps) {
  const libraryMeta = REFERENCES[sdkId]
  const versions = libraryMeta?.versions ?? []
  const isLatestVersion = libVersion === versions[0]

  const menuData = NavItems[libraryMeta.meta[libVersion].libId]

  return (
    <ReferenceContentScrollHandler
      libPath={libraryMeta.libPath}
      version={libVersion}
      isLatestVersion={isLatestVersion}
    >
      <SidebarSkeleton
        menuId={MenuId.RefJavaScriptV2}
        NavigationMenu={
          <ClientSdkNavigation
            sdkId={sdkId}
            name={menuData.title}
            menuData={menuData}
            libPath={libraryMeta.libPath}
            version={libVersion}
            isLatestVersion={isLatestVersion}
          />
        }
      >
        <LayoutMainContent>
          {!isLatestVersion && (
            <OldVersionAlert
              libPath={libraryMeta.libPath}
              className="z-10 fixed top-[calc(var(--header-height)+1rem)] right-4 w-84 max-w-[calc(100vw-2rem)]"
            />
          )}
          <article className="@container/article">
            <ClientLibHeader menuData={menuData} className="mt-4 mb-8" />
            <ClientLibIntroduction
              libPath={libraryMeta.libPath}
              excludeName={libraryMeta.meta[libVersion].libId}
              version={libVersion}
              isLatestVersion={isLatestVersion}
            />
            <ClientLibRefSections sdkId={sdkId} version={libVersion} />
          </article>
        </LayoutMainContent>
      </SidebarSkeleton>
    </ReferenceContentScrollHandler>
  )
}
