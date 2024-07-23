import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import * as NavItems from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { REFERENCES } from '~/content/navigation.references'
import { ClientLibHeader } from '~/features/docs/Reference.header'
import { ClientLibIntroduction, OldVersionAlert } from '~/features/docs/Reference.introduction'
import { ClientSdkNavigation } from '~/features/docs/Reference.navigation'
import { ReferenceContentScrollHandler } from '~/features/docs/Reference.navigation.client'
import { ClientLibRefSections } from '~/features/docs/Reference.sections'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'

type ClientSdkReferenceProps = {
  sdkId: string
  libId: string
  libPath: string
  libVersion: string
  specFile: string
  useTypeSpec?: boolean
} & (
  | { isCrawlerPage?: false; requestedSection?: string }
  | { isCrawlerPage: true; requestedSection: string }
)

export async function ClientSdkReferencePage({
  sdkId,
  libId,
  libPath,
  libVersion,
  specFile,
  useTypeSpec = false,
  isCrawlerPage = false,
  requestedSection,
}: ClientSdkReferenceProps) {
  const libraryMeta = REFERENCES[libPath]
  const versions = libraryMeta?.versions ?? []
  const isLatestVersion = libVersion === versions[0]

  const menuData = NavItems[libId]

  return (
    <ReferenceContentScrollHandler libPath={libPath}>
      <SidebarSkeleton
        menuId={MenuId.RefJavaScriptV2}
        NavigationMenu={
          <ClientSdkNavigation
            sdkId={sdkId}
            name={menuData.title}
            menuData={menuData}
            libPath={libPath}
            version={libVersion}
            isLatestVersion={isLatestVersion}
            isCrawlerPage={isCrawlerPage}
          />
        }
      >
        <LayoutMainContent>
          {!isLatestVersion && (
            <OldVersionAlert
              libPath={libPath}
              className="z-10 fixed top-[calc(var(--header-height)+1rem)] right-4 w-84 max-w-[calc(100vw-2rem)]"
            />
          )}
          <article className="@container/article">
            {!isCrawlerPage && (
              <>
                <ClientLibHeader menuData={menuData} className="mt-4 mb-8" />
                <ClientLibIntroduction
                  libPath={libPath}
                  excludeName={libId}
                  version={libVersion}
                  isLatestVersion={isLatestVersion}
                />
              </>
            )}
            <ClientLibRefSections
              sdkId={sdkId}
              libPath={libPath}
              version={libVersion}
              isLatestVersion={isLatestVersion}
              specFile={specFile}
              useTypeSpec={useTypeSpec}
              {...(isCrawlerPage
                ? { isCrawlerPage: true, requestedSection }
                : { isCrawlerPage: false })}
            />
          </article>
        </LayoutMainContent>
      </SidebarSkeleton>
    </ReferenceContentScrollHandler>
  )
}
