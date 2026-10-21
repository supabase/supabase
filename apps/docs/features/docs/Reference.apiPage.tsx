import { AdditionalLinks, GuidesSidebar } from '~/components/GuidesSidebar'
import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import { reference_api } from '~/components/Navigation/NavigationMenu/NavigationMenu.constants'
import { TocAnchorsProvider } from '~/features/docs/GuidesMdx.client'
import { getSectionsBySlug } from '~/features/docs/Reference.generated.singleton'
import { ReferenceNavigation } from '~/features/docs/Reference.navigation'
import { ReferenceContentScrollHandler } from '~/features/docs/Reference.navigation.client'
import { SectionSwitch } from '~/features/docs/Reference.sections'
import { LayoutMainContent } from '~/layouts/DefaultLayout'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'
import { notFound, redirect } from 'next/navigation'
import { cn } from 'ui'

const INTRODUCTION_LINKS = [
  { title: 'OpenAPI Docs', href: 'https://api.supabase.com/api/v1' },
  { title: 'OpenAPI Spec', href: 'https://api.supabase.com/api/v1-json' },
  { title: 'Report bugs and issues', href: 'https://github.com/supabase/supabase' },
]

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

  const isIntroduction = section.type === 'markdown'

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
          {isIntroduction ? (
            <TocAnchorsProvider>
              <div className="grid grid-cols-12 relative gap-4">
                <article
                  // Used to get headings for the table of contents
                  id="sb-docs-guide-main-article"
                  className="@container/article col-span-12 md:col-span-8 min-w-0"
                >
                  <SectionSwitch libraryId="api" version="latest" section={section} />
                  {/* The sidebar is hidden below `md`, so keep the links reachable */}
                  <AdditionalLinks links={INTRODUCTION_LINKS} className="mt-8 md:hidden" />
                </article>
                <GuidesSidebar
                  links={INTRODUCTION_LINKS}
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
              <SectionSwitch libraryId="api" version="latest" section={section} />
            </article>
          )}
        </LayoutMainContent>
      </SidebarSkeleton>
    </ReferenceContentScrollHandler>
  )
}
