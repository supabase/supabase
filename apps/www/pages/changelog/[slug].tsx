import dayjs from 'dayjs'
import type { GetStaticPaths, GetStaticProps } from 'next'
import { MDXRemote, type MDXRemoteSerializeResult } from 'next-mdx-remote'
import { NextSeo } from 'next-seo'
import Head from 'next/head'
import Link from 'next/link'

import { ChangelogDetailSidebar } from '@/components/Changelog/ChangelogDetailSidebar'
import CTABanner from '@/components/CTABanner'
import DefaultLayout from '@/components/Layouts/Default'
import {
  CHANGELOG_CATEGORY_ID,
  createChangelogOctokit,
  fetchChangelogDiscussionByNumber,
  type ChangelogLabel,
} from '@/lib/changelog-github'
import { changelogEntrySlug, discussionDisplayDate } from '@/lib/changelog.utils'
import mdxComponents from '@/lib/mdx/mdxComponents'
import { mdxSerialize } from '@/lib/mdx/mdxSerialize'

type PageProps = {
  title: string
  url: string
  created_at: string
  number: number
  slug: string
  source: MDXRemoteSerializeResult
  labels: ChangelogLabel[]
}

const ChangelogDetailPage = ({ title, url, created_at, slug, source, labels }: PageProps) => (
  <>
    <Head>
      <link rel="alternate" type="text/markdown" href={`/changelog/${slug}.md`} />
    </Head>
    <NextSeo
      title={`${title} · Changelog`}
      description={title}
      openGraph={{
        title,
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
          <h1 className="h1 text-2xl sm:text-3xl">{title}</h1>
          <p className="text-foreground-lighter font-mono text-xs">
            {dayjs(created_at).format('MMM D, YYYY')}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10 mb-8 lg:mb-20">
          <div className="min-w-0 lg:col-span-8">
            <article className="prose prose-docs max-w-none [overflow-wrap:break-word] [&>*:first-child:not(style):not(script)]:mt-0 [&>style:first-child+*]:mt-0 [&>script:first-child+*]:mt-0 [&>*:last-child:not(style):not(script)]:mb-0">
              <MDXRemote {...source} components={mdxComponents('blog')} />
            </article>
          </div>

          <aside className="border-default border-t pt-6 lg:col-span-4 lg:border-t-0 lg:pl-4 lg:pt-0">
            <div className="thin-scrollbar lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
              <ChangelogDetailSidebar slug={slug} url={url} labels={labels} />
            </div>
          </aside>
        </div>
      </div>
      <CTABanner />
    </DefaultLayout>
  </>
)

export const getStaticPaths: GetStaticPaths = async () => {
  return { paths: [], fallback: 'blocking' }
}

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  const raw = params?.slug
  const slugStr = Array.isArray(raw) ? raw[0] : (raw ?? '')
  // The slug always starts with the numeric discussion number.
  const number = parseInt(slugStr, 10)
  if (!Number.isFinite(number) || number <= 0) return { notFound: true }

  try {
    const octokit = createChangelogOctokit()
    const discussion = await fetchChangelogDiscussionByNumber(
      octokit,
      'supabase',
      'supabase',
      number
    )

    if (!discussion || discussion.category?.id !== CHANGELOG_CATEGORY_ID) {
      return { notFound: true }
    }

    const expectedSlug = changelogEntrySlug(number, discussion.title)

    // Redirect number-only or mismatched slugs to the canonical slug URL.
    if (slugStr !== expectedSlug) {
      return { redirect: { destination: `/changelog/${expectedSlug}`, permanent: true } }
    }

    const source = await mdxSerialize(discussion.body)
    const created_at =
      discussionDisplayDate({
        title: discussion.title,
        createdAt: discussion.createdAt,
      }) ?? discussion.createdAt

    return {
      props: {
        title: discussion.title,
        url: discussion.url,
        created_at,
        number,
        slug: expectedSlug,
        source,
        labels: discussion.labels?.nodes ?? [],
      },
      revalidate: 900,
    }
  } catch (e) {
    console.error(e)
    return { notFound: true }
  }
}

export default ChangelogDetailPage
