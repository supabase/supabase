import { metadata as mainMetadata } from '@/app/layout'
import { ChapterCompletion } from '@/components/chapter-completion'
import { CourseHero } from '@/components/course-hero'
import { ExploreMore } from '@/components/explore-more'
import { Mdx } from '@/components/mdx-components'
import { NextUp } from '@/components/next-up'
import { DashboardTableOfContents } from '@/components/toc'
import { courses } from '@/config/docs'
import { getCurrentChapter } from '@/lib/get-current-chapter'
import { getNextPage } from '@/lib/get-next-page'
import { getTableOfContents } from '@/lib/toc'
import { absoluteUrl, cn } from '@/lib/utils'
import type { SidebarNavItem } from '@/types/nav'

import '@/styles/code-block-variables.css'
import '@/styles/mdx.css'

import { allDocs } from 'contentlayer/generated'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Balancer from 'react-wrap-balancer'
import { ScrollArea } from 'ui'

interface DocPageProps {
  params: Promise<{
    slug: string[]
  }>
}

async function getDocFromParams({ params }: { params: { slug: string[] } }) {
  const slug = params.slug?.join('/') || ''
  const doc = allDocs.find((doc) => doc.slugAsParams === slug)

  if (!doc) {
    return null
  }

  return doc
}

export async function generateMetadata(props: DocPageProps): Promise<Metadata> {
  const params = await props.params
  const doc = await getDocFromParams({ params })
  // get page params so we can check if it's the introduction page
  const slugSegments = doc?.slugAsParams.split('/')
  const isIntroductionPage = slugSegments?.[slugSegments.length - 1] === 'introduction'

  if (!doc) {
    return {}
  }

  const metadata: Metadata = {
    ...mainMetadata,
    title: doc.title,
    description: doc.description,
    openGraph: {
      ...(mainMetadata.openGraph || {}),
      title: doc.title,
      description: doc.description,
      type: 'article',
      url: absoluteUrl(doc.slug),
    },
  }
  return metadata
}

export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  return allDocs.map((doc) => ({
    slug: doc.slugAsParams.split('/'),
  }))
}

const DocPage = async (props: DocPageProps) => {
  const params = await props.params
  const doc = await getDocFromParams({ params })

  if (!doc) {
    notFound()
  }

  const toc = await getTableOfContents(doc.body.raw)
  const nextPage = getNextPage(doc.slugAsParams)
  const currentChapter = getCurrentChapter(doc.slugAsParams)
  const slugSegments = doc.slugAsParams.split('/')
  const isIntroductionPage = slugSegments[slugSegments.length - 1] === 'introduction'

  const exploreItems = (
    doc as {
      explore?: Array<{ title: string; link: string; itemType?: string; description?: string }>
    }
  ).explore

  // Build breadcrumb hierarchy
  const breadcrumb: { label: string; href?: string }[] = [{ label: 'Learn', href: '/' }]

  // Find course, module, and chapter
  const course = courses.items[0] // Foundations - only one course for now
  if (course) {
    // Link to course introduction or first page
    breadcrumb.push({ label: course.title, href: '/foundations/introduction' })

    // Check if this is a standalone item or part of a module
    let foundModule: SidebarNavItem | null = null
    course.items?.forEach((item: SidebarNavItem) => {
      if (item.items && item.items.length > 0) {
        // It's a module
        const foundLesson = item.items.find((lesson) => lesson.href === doc.slug)
        if (foundLesson) {
          // Link to first lesson in module
          const firstLessonHref = item.items[0]?.href
          breadcrumb.push({ label: item.title, href: firstLessonHref })
          foundModule = item
        }
      }
    })

    // Add the current page title (no link since we're on this page)
    breadcrumb.push({ label: doc.title })
  }

  return (
    <div className={cn('relative')}>
      {isIntroductionPage && doc.courseHero && (
        <CourseHero
          title={doc.courseHero.title}
          subtitle={doc.courseHero.subtitle}
          description={doc.courseHero.description}
          //instructors={doc.courseHero.instructors}
        />
      )}

      <div
        className={cn(
          'relative lg:gap-10 xl:grid xl:grid-cols-[1fr_200px]  py-20',
          isIntroductionPage ? 'px-0' : 'px-8 md:px-16'
        )}
      >
        <div className="mx-auto w-full min-w-0 max-w-4xl">
          <div className="mb-4 flex items-center gap-3 text-sm text-foreground-muted">
            {breadcrumb.map((crumb, index) => (
              <span key={index} className="flex items-center gap-3">
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-foreground transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground-light">{crumb.label}</span>
                )}
                {index < breadcrumb.length - 1 && <span>/</span>}
              </span>
            ))}
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-5">
            <div className="space-y-2">
              <h1 className="scroll-m-20 text-3xl lg:text-4xl tracking-tight">{doc.title}</h1>
              {doc.description && (
                <p className="text-base lg:text-lg text-foreground-light">
                  <Balancer>{doc.description}</Balancer>
                </p>
              )}
            </div>
          </div>
          <div className="pb-12">
            <Mdx code={doc.body.code} />
          </div>
          {exploreItems && exploreItems.length > 0 && <ExploreMore items={exploreItems} />}
          {currentChapter && nextPage && (
            <ChapterCompletion
              chapterNumber={currentChapter.chapterNumber!}
              completionMessage={currentChapter.completionMessage}
            />
          )}
          {nextPage && (
            <div className="flex w-2xl grow">
              <NextUp
                title={nextPage.title}
                description={nextPage.description || ''}
                href={nextPage.href}
                chapterNumber={nextPage.chapterNumber}
              />
            </div>
          )}
        </div>
        {doc.toc && (
          <div className="hidden text-sm xl:block">
            <div className="sticky top-16 -mt-10 pt-4">
              <ScrollArea className="pb-10">
                <div className="sticky top-16 -mt-10 h-[calc(100vh-3.5rem)] py-12">
                  <DashboardTableOfContents toc={toc} />
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export { DocPage as default }
