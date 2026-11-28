import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import { reference_api } from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { GuideTocMenu, TocAnchorsProvider } from '~/features/docs/GuidesMdx.client'
import { getSectionsBySlug } from '~/features/docs/Reference.generated.singleton'
import { getRefFrontmatter } from '~/features/docs/Reference.mdx'
import { ReferenceNavigation } from '~/features/docs/Reference.navigation'
import { ReferenceContentScrollHandler } from '~/features/docs/Reference.navigation.client'
import { SectionSwitch } from '~/features/docs/Reference.sections'
import {
  ReferenceLinks,
  ReferenceSidebar,
  type ReferenceLink,
} from '~/features/docs/Reference.sidebar'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'
import { PROD_URL } from '~/lib/constants'
import { serializeJsonLd, techArticleSchema } from '~/lib/json-ld'
import { notFound, redirect } from 'next/navigation'
import { cn } from 'ui'

export async function ApiReferencePage({ path }: { path: Array<string> }) {
  const operationSlug = path[0]

  if (!operationSlug) {
    redirect('/reference/api/introduction')
  }

  return <ApiOperationPage operationSlug={operationSlug} />
}

// DOCS-1268: one endpoint per page, reusing the same SectionSwitch (and
// therefore the same ApiEndpointSection/MarkdownSection) that used to render
// every operation on the single monolithic /reference/api page.
async function ApiOperationPage({ operationSlug }: { operationSlug: string }) {
  const sectionsBySlug = await getSectionsBySlug('api', 'latest')
  const section = sectionsBySlug?.get(operationSlug)
  if (!section) notFound()

  const navigationProps = {
    libraryId: 'api',
    name: 'Management API',
    menuData: reference_api,
    libPath: 'api',
    version: 'latest',
    isLatestVersion: true,
    realNavigation: true,
  }

  const isIntroduction = section.type === 'markdown'
  const additionalLinks = isIntroduction
    ? (((await getRefFrontmatter(`api/${section.id}`)).links as ReferenceLink[] | undefined) ?? [])
    : []

  const title = section.title ?? operationSlug
  const techArticleJsonLd = serializeJsonLd(
    techArticleSchema({
      url: `${PROD_URL}/reference/api/${operationSlug}`,
      headline: `Management API: ${title}`,
      description: `Management API reference for the Supabase API: ${title}`,
    })
  )

  return (
    <ReferenceContentScrollHandler
      libPath={navigationProps.libPath}
      version={navigationProps.version}
      isLatestVersion={navigationProps.isLatestVersion}
    >
      <SidebarSkeleton
        menuId={MenuId.RefApi}
        hasRightRail={isIntroduction}
        NavigationMenu={<ReferenceNavigation {...navigationProps} />}
      >
        <LayoutMainContent className="layout-v2:mx-0 layout-v2:pt-6">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: techArticleJsonLd }}
          />
          {isIntroduction ? (
            <TocAnchorsProvider>
              <div className="grid grid-cols-12 relative gap-4">
                <article
                  id="sb-docs-guide-main-article"
                  className="@container/article col-span-12 md:col-span-8 layout-v2:md:col-span-12 min-w-0"
                >
                  <GuideTocMenu />
                  <SectionSwitch libraryId="api" version="latest" section={section} />
                  {additionalLinks.length !== 0 && (
                    <ReferenceLinks
                      links={additionalLinks}
                      className="mt-8 md:hidden layout-v2:md:block layout-v2:lg:hidden"
                    />
                  )}
                </article>
                <ReferenceSidebar
                  links={additionalLinks}
                  className={cn(
                    'hidden md:flex md:col-span-3 md:col-start-10',
                    'self-start sticky',
                    'top-[calc(var(--header-height)+3rem)]',
                    'max-h-[calc(100vh-var(--header-height)-4rem)]'
                  )}
                />
              </div>
            </TocAnchorsProvider>
          ) : (
            <article className="@container/article">
              <SectionSwitch libraryId="api" version="latest" section={section} tag="h1" />
            </article>
          )}
        </LayoutMainContent>
      </SidebarSkeleton>
    </ReferenceContentScrollHandler>
  )
}
