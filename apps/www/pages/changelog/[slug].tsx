import dayjs from 'dayjs'
import type { GetStaticPaths, GetStaticProps } from 'next'
import { MDXClient, type SerializeResult as MDXRemoteSerializeResult } from 'next-mdx-remote-client'
import { NextSeo } from 'next-seo'
import Head from 'next/head'
import Link from 'next/link'

import { ChangelogDetailSidebar } from '@/components/Changelog/ChangelogDetailSidebar'
import { ChangelogInlineMarkdown } from '@/components/Changelog/ChangelogInlineMarkdown'
import CTABanner from '@/components/CTABanner'
import DefaultLayout from '@/components/Layouts/Default'
import { getChangelogEntries, type ChangelogEntryFrontmatter } from '@/lib/changelog-repo'
import { stripTitleMarkdown } from '@/lib/changelog.utils'
import mdxComponents from '@/lib/mdx/mdxComponents'
import { mdxSerialize } from '@/lib/mdx/mdxSerialize'

type PageProps = {
  title: string
  created_at: string
  slug: string
  frontmatter: ChangelogEntryFrontmatter
  source: MDXRemoteSerializeResult
}

const ChangelogDetailPage = ({ title, created_at, slug, frontmatter, source }: PageProps) => {
  const plainTitle = stripTitleMarkdown(title)
  return (
    <>
      <Head>
        <link rel="alternate" type="text/markdown" href={`/changelog/${slug}.md`} />
      </Head>
      <NextSeo
        title={`${plainTitle} · Changelog`}
        description={plainTitle}
        openGraph={{
          title: plainTitle,
          url: `https://supabase.com/changelog/${slug}`,
          type: 'article',
        }}
      />
      <DefaultLayout>
        <div className="container mx-auto max-w-5xl px-4 py-10 sm:px-16 xl:px-20">
          <nav
            aria-label="Breadcrumb"
            className="text-foreground-lighter mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
          >
            <Link href="/changelog" className="text-foreground-lighter hover:underline">
              Changelog
            </Link>
          </nav>
          <header className="border-default mb-8 flex flex-col gap-2 border-b pb-6">
            <h1 className="h1 text-2xl sm:text-3xl [&_code]:align-middle">
              <ChangelogInlineMarkdown>{title}</ChangelogInlineMarkdown>
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-foreground-lighter font-mono text-xs">
                {dayjs(created_at).format('MMM D, YYYY')}
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10 mb-8 lg:mb-20">
            <div className="min-w-0 lg:col-span-8">
              <article className="prose prose-docs max-w-none wrap-break-word [&>*:first-child:not(style):not(script)]:mt-0 [&>style:first-child+*]:mt-0 [&>script:first-child+*]:mt-0 [&>*:last-child:not(style):not(script)]:mb-0">
                {'error' in source ? (
                  <p>Error rendering changelog entry: {source.error.message}</p>
                ) : (
                  <MDXClient {...source} components={mdxComponents('blog')} />
                )}
              </article>
            </div>

            <aside className="border-default border-t pt-6 lg:col-span-4 lg:border-t-0 lg:pl-4 lg:pt-0">
              <div className="thin-scrollbar lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
                <ChangelogDetailSidebar slug={slug} frontmatter={frontmatter} />
              </div>
            </aside>
          </div>
        </div>
        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  return { paths: [], fallback: 'blocking' }
}

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  const raw = params?.slug
  const slug = Array.isArray(raw) ? raw[0] : (raw ?? '')

  const entries = await getChangelogEntries()
  const entry = entries.find((e) => e.slug === slug)
  // `revalidate` on notFound too, else Next.js caches the 404 forever — an entry
  // requested before it went live would keep 404ing after publish.
  if (!entry) return { notFound: true, revalidate: 900 }

  const source = await mdxSerialize(entry.bodySection)

  return {
    props: {
      title: entry.frontmatter.title,
      created_at: entry.sortDate,
      slug: entry.slug,
      frontmatter: entry.frontmatter,
      source,
    },
    revalidate: 900,
  }
}

export default ChangelogDetailPage
