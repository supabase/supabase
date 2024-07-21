import { redirect } from 'next/navigation'

import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import * as NavItems from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { ClientLibHeader } from '~/features/docs/Reference.header'
import { ClientLibIntroduction, OldVersionAlert } from '~/features/docs/Reference.introduction'
import { ClientSdkNavigation } from '~/features/docs/Reference.navigation'
import { ReferenceContentScrollHandler } from '~/features/docs/Reference.navigation.client'
import { ClientLibRefSections } from '~/features/docs/Reference.sections'
import {
  flattenCommonClientLibSections,
  genClientSdkSectionTree,
} from '~/features/docs/Reference.utils'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'

type ClientSdkReferenceProps = {
  libId: string
  libPath: string
  libVersion: string
  specFile: string
  useTypeSpec?: boolean
} & (
  | { isCrawlerPage?: false; requestedSection?: undefined }
  | { isCrawlerPage: true; requestedSection: string }
)

export async function ClientSdkReferencePage({
  libId,
  libPath,
  libVersion,
  specFile,
  useTypeSpec = false,
  isCrawlerPage = false,
  requestedSection,
}: ClientSdkReferenceProps) {
  const libraryMeta = NavItems.REFERENCES?.[libPath] ?? undefined
  const versions = libraryMeta?.versions ?? []
  const isLatestVersion = libVersion === versions[0]

  const menuData = NavItems[libId]

  return (
    <ReferenceContentScrollHandler libPath={libPath}>
      <SidebarSkeleton
        menuId={MenuId.RefJavaScriptV2}
        NavigationMenu={
          <ClientSdkNavigation
            name={menuData.title}
            menuData={menuData}
            libPath={libPath}
            version={libVersion}
            specFile={specFile}
            excludeName={libId}
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
              libPath={libPath}
              version={libVersion}
              isLatestVersion={isLatestVersion}
              specFile={specFile}
              excludeName={libId}
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

export function generateReferenceStaticParams(specFile: string, excludeName: string) {
  return async function generateStaticParamsForClientSdk() {
    const sectionTree = await genClientSdkSectionTree(specFile, excludeName)
    const flattenedSections = flattenCommonClientLibSections(sectionTree)

    const sections: Array<{ slug: Array<string> }> = [{ slug: [] }].concat(
      flattenedSections
        .filter((section) => section.type !== 'category' && !!section.slug)
        .map((section) => ({
          slug: [section.slug],
        }))
    )

    return sections
  }
}

export async function redirectNonexistentReferenceSection(
  slug: Array<string> | undefined,
  specFile,
  excludeName
) {
  const initialSelectedSection = slug?.[0]

  const validSlugs = await generateReferenceStaticParams(specFile, excludeName)()
  if (
    initialSelectedSection &&
    !validSlugs.some((params) => params.slug[0] === initialSelectedSection)
  ) {
    redirect('/reference/javascript')
  }
}
