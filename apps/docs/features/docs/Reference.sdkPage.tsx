import type { Metadata, ResolvingMetadata } from 'next'
import { redirect } from 'next/navigation'

import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import * as NavItems from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { REFERENCES, clientSdkIds } from '~/content/navigation.references'
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
  | { isCrawlerPage?: false; requestedSection?: string }
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

export function parseReferencePath(slug: Array<string>) {
  const isClientSdkReference = clientSdkIds.includes(slug[0])

  if (isClientSdkReference) {
    let [sdkId, maybeVersion, maybeCrawlers, ...path] = slug
    if (!/v\d+/.test(maybeVersion)) {
      maybeVersion = null
      maybeCrawlers = maybeVersion
      path = [maybeCrawlers, ...path]
    }
    if (maybeCrawlers !== 'crawlers') {
      maybeCrawlers = null
      path = [maybeCrawlers, ...path]
    }

    return {
      __type: 'clientSdk' as const,
      sdkId,
      maybeVersion,
      maybeCrawlers,
      path,
    }
  } else {
    return {
      __type: 'UNIMPLEMENTED' as const,
    }
  }
}

async function generateStaticParamsForSdkVersion(
  sdkId: string,
  version: string,
  maybeSpecFile?: string,
  maybeExcludeName?: string
) {
  const specFile = maybeSpecFile ?? REFERENCES[sdkId].meta[version].specFile
  const excludeName = maybeExcludeName ?? REFERENCES[sdkId].meta[version].excludeName

  const sectionTree = await genClientSdkSectionTree(specFile, excludeName)
  const flattenedSections = flattenCommonClientLibSections(sectionTree)

  return flattenedSections
    .filter((section) => section.type !== 'category' && !!section.slug)
    .map((section) => ({
      slug: [
        sdkId,
        version === REFERENCES[sdkId].versions[0] ? null : version,
        'crawlers',
        ...section.slug,
      ].filter(Boolean),
    }))
}

export async function generateReferenceStaticParams() {
  const pendingSections = clientSdkIds
    .flatMap((sdkId) =>
      REFERENCES[sdkId].versions.map((version) => ({
        sdkId,
        version,
        specFile: REFERENCES[sdkId].meta[version].specFile,
        excludeName: REFERENCES[sdkId].meta[version].excludeName,
      }))
    )
    .map(async ({ sdkId, version, specFile, excludeName }) => {
      return generateStaticParamsForSdkVersion(sdkId, version, specFile, excludeName)
    })

  return (await Promise.all(pendingSections)).flat()
}

export async function generateReferenceMetadata(
  { params: { slug } }: { params: { slug: Array<string> } },
  resolvingParent: ResolvingMetadata
): Promise<Metadata> {
  const { alternates: parentAlternates, openGraph: parentOg } = await resolvingParent
  const flattenedSections = flattenCommonClientLibSections(
    commonClientLibSections as Array<AbbrevCommonClientLibSection>
  )

  const parsedPath = parseReferencePath(slug)
  const isClientSdkReference = parsedPath.__type === 'clientSdk'

  if (isClientSdkReference) {
    const { sdkId, maybeVersion } = parsedPath

    const displayName = REFERENCES[sdkId].name
    const sectionTitle =
      slug.length > 0
        ? flattenedSections.find((section) => section.slug === slug[0])?.title
        : undefined
    const url = [BASE_PATH, 'reference', sdkId, maybeVersion, slug[0]].filter(Boolean).join('/')

    return {
      title: `${displayName} API Reference | Supabase Docs`,
      description: `API reference for the ${displayName} Supabase SDK`,
      ...(slug.length > 0
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
  } else {
    return {}
  }
}

export async function redirectNonexistentReferenceSection(
  sdkId: string,
  version: string,
  path: Array<string>,
  isLatestVersion: boolean
) {
  const initialSelectedSection = path[0]

  const validSlugs = await generateStaticParamsForSdkVersion(sdkId, version)

  if (
    initialSelectedSection &&
    !validSlugs.some((params) => params.slug[0] === initialSelectedSection)
  ) {
    redirect(`/reference/${sdkId}` + (!isLatestVersion ? '/' + version : ''))
  }
}
