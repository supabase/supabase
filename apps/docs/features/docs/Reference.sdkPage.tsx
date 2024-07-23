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
  libVersion: string
} & (
  | { isCrawlerPage?: false; requestedSection?: string }
  | { isCrawlerPage: true; requestedSection: string }
)

const _clientSdkComponentCache = new Map<string, any>()
export async function ClientSdkReferencePage(props) {
  const key = JSON.stringify(props)
  if (!_clientSdkComponentCache.has(key)) {
    _clientSdkComponentCache.set(key, ClientSdkReferencePageUncached(props))
  }
  return _clientSdkComponentCache.get(key)
}
async function ClientSdkReferencePageUncached({
  sdkId,
  libVersion,
  isCrawlerPage = false,
  requestedSection,
}: ClientSdkReferenceProps) {
  const libraryMeta = REFERENCES[sdkId]
  const versions = libraryMeta?.versions ?? []
  const isLatestVersion = libVersion === versions[0]

  const menuData = NavItems[libraryMeta.meta[libVersion].libId]

  return (
    <ReferenceContentScrollHandler libPath={libraryMeta.libPath}>
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
            isCrawlerPage={isCrawlerPage}
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
            {!isCrawlerPage && (
              <>
                <ClientLibHeader menuData={menuData} className="mt-4 mb-8" />
                <ClientLibIntroduction
                  libPath={libraryMeta.libPath}
                  excludeName={libraryMeta.meta[libVersion].libId}
                  version={libVersion}
                  isLatestVersion={isLatestVersion}
                />
              </>
            )}
            <ClientLibRefSections
              sdkId={sdkId}
              libPath={libraryMeta.libPath}
              version={libVersion}
              isLatestVersion={isLatestVersion}
              specFile={libraryMeta.meta[libVersion].specFile}
              useTypeSpec={libraryMeta.typeSpec}
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
