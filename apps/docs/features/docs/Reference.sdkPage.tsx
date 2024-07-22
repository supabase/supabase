import type { Metadata, ResolvingMetadata } from 'next'
import { redirect } from 'next/navigation'

import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import * as NavItems from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { ClientLibHeader } from '~/features/docs/Reference.header'
import { ClientLibIntroduction, OldVersionAlert } from '~/features/docs/Reference.introduction'
import { ClientSdkNavigation } from '~/features/docs/Reference.navigation'
import { ReferenceContentScrollHandler } from '~/features/docs/Reference.navigation.client'
import { ClientLibRefSections } from '~/features/docs/Reference.sections'
import type { AbbrevCommonClientLibSection } from '~/features/docs/Reference.utils'
import {
  flattenCommonClientLibSections,
  genClientSdkSectionTree,
} from '~/features/docs/Reference.utils'
import { pluckPromise } from '~/features/helpers.fn'
import { generateOpenGraphImageMeta } from '~/features/seo/openGraph'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'
import { BASE_PATH } from '~/lib/constants'
import commonClientLibSections from '~/spec/common-client-libs-sections.json' assert { type: 'json' }

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

export function generateReferenceMetadata(libPath: string, versionIfNotLatest?: string) {
  return async function generateMetadataForLibraryFunction(
    {
      params,
    }: {
      params: { slug?: Array<string> }
    },
    parent: ResolvingMetadata
  ): Promise<Metadata> {
    const [parentAlternates, parentOg] = await Promise.all([
      pluckPromise(parent, 'alternates'),
      pluckPromise(parent, 'openGraph'),
    ])
    const flattenedSections = flattenCommonClientLibSections(
      commonClientLibSections as Array<AbbrevCommonClientLibSection>
    )

    const displayName = NavItems.REFERENCES[libPath].name
    const sectionTitle =
      params.slug?.length > 0
        ? flattenedSections.find((section) => section.slug === params.slug[0])?.title
        : undefined
    const url = `${BASE_PATH}/reference/${libPath}/${versionIfNotLatest ? `${versionIfNotLatest}/` : ''}${params.slug?.[0] ?? ''}`

    return {
      title: `${displayName} API Reference | Supabase Docs`,
      description: `API reference for the ${displayName} Supabase SDK`,
      ...(params.slug?.length > 0
        ? {
            alternates: {
              ...parentAlternates,
              canonical: url,
            },
          }
        : {}),
      openGraph: {
        ...parentOg,
        url,
        images: generateOpenGraphImageMeta({
          type: 'API Reference',
          title: `${displayName}${sectionTitle ? `: ${sectionTitle}` : ''}`,
        }),
      },
    }
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
