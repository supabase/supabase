import * as NavItems from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { REFERENCES } from '~/content/navigation.references'
import { ClientLibHeader } from '~/features/docs/Reference.header'
import { ClientLibIntroduction, OldVersionAlert } from '~/features/docs/Reference.introduction'
import { RefSections } from '~/features/docs/Reference.sections'
import { ReferencePageShell } from '~/features/docs/Reference.shell'

interface ClientSdkReferenceProps {
  sdkId: string
  libVersion: string
}

export async function ClientSdkReferencePage({ sdkId, libVersion }: ClientSdkReferenceProps) {
  const libraryMeta = REFERENCES[sdkId]
  const versions = libraryMeta?.versions ?? []
  const isLatestVersion = libVersion === versions[0]

  const menuData = NavItems[libraryMeta.meta[libVersion].libId]

  const navigationProps = {
    libraryId: sdkId,
    name: menuData.title,
    menuData,
    libPath: libraryMeta.libPath,
    version: libVersion,
    isLatestVersion,
  }

  return (
    <ReferencePageShell menuId={libraryMeta.meta[libVersion].libId} navigation={navigationProps}>
      {!isLatestVersion && (
        <OldVersionAlert
          libPath={libraryMeta.libPath}
          className="z-20 fixed top-[calc(var(--header-height)+1rem)] right-4 layout-v2:lg:right-[calc(var(--docs-side-column-width)+1rem)] w-84 max-w-[calc(100vw-2rem)]"
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
        <RefSections libraryId={sdkId} version={libVersion} />
      </article>
    </ReferencePageShell>
  )
}
