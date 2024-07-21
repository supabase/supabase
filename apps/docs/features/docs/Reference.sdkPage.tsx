import { redirect } from 'next/navigation'

import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import * as NavItems from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { ClientLibHeader } from '~/features/docs/Reference.header'
import { ClientLibIntroduction } from '~/features/docs/Reference.introduction'
import { ClientSdkNavigation } from '~/features/docs/Reference.navigation'
import { ReferenceContentScrollHandler } from '~/features/docs/Reference.navigation.client'
import { ClientLibRefSections } from '~/features/docs/Reference.sections'
import {
  flattenCommonClientLibSections,
  genClientSdkSectionTree,
} from '~/features/docs/Reference.utils'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'

interface ClientSdkReferenceProps {
  libId: string
  libPath: string
  libVersion: string
  specFile: string
  useTypeSpec?: boolean
}

export async function ClientSdkReferencePage({
  libId,
  libPath,
  libVersion,
  specFile,
  useTypeSpec = false,
}: ClientSdkReferenceProps) {
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
          />
        }
      >
        <LayoutMainContent>
          <article className="@container/article">
            <ClientLibHeader menuData={menuData} className="mt-4 mb-8" />
            <ClientLibIntroduction libPath={libPath} excludeName={libId} />
            <ClientLibRefSections
              libPath={libPath}
              specFile={specFile}
              excludeName={libId}
              useTypeSpec={useTypeSpec}
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
