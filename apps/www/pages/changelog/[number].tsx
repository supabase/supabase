import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/outline'
import { ChangelogRssButton } from '~/components/Changelog/ChangelogRssButton'
import { LabelBadges } from '~/components/Changelog/ChangelogV3TimelineList'
import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import {
  CHANGELOG_CATEGORY_ID,
  createChangelogOctokit,
  fetchAllChangelogDiscussionMetadata,
  fetchChangelogDiscussionByNumber,
  type ChangelogLabel,
} from '~/lib/changelog-github'
import { discussionDisplayDate } from '~/lib/changelog.utils'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { mdxSerialize } from '~/lib/mdx/mdxSerialize'
import dayjs from 'dayjs'
import { ArrowUpRightIcon } from 'lucide-react'
import { GetServerSideProps } from 'next'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import { NextSeo } from 'next-seo'
import Link from 'next/link'

type PageProps = {
  title: string
  url: string
  created_at: string
  number: number
  source: MDXRemoteSerializeResult
  labels: ChangelogLabel[]
  prevNumber: number | null
  nextNumber: number | null
}

export const getServerSideProps: GetServerSideProps<PageProps> = async ({ params, res }) => {
  res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=900')

  const raw = params?.number
  const numStr = Array.isArray(raw) ? raw[0] : raw
  const number = Number(numStr)
  if (!Number.isFinite(number)) {
    return { notFound: true }
  }

  const octokit = createChangelogOctokit()
  const discussion = await fetchChangelogDiscussionByNumber(octokit, 'supabase', 'supabase', number)

  if (!discussion || discussion.category?.id !== CHANGELOG_CATEGORY_ID) {
    return { notFound: true }
  }

  const metadata = await fetchAllChangelogDiscussionMetadata(
    octokit,
    'supabase',
    'supabase',
    CHANGELOG_CATEGORY_ID
  )

  const visible = metadata
    .filter((item) => !item.title.includes('[d]'))
    .map((item) => ({
      number: item.number,
      sortDate: discussionDisplayDate(item),
    }))
    .sort((a, b) => dayjs(b.sortDate).diff(dayjs(a.sortDate)))

  const pos = visible.findIndex((item) => item.number === number)
  let prevNumber: number | null = null
  let nextNumber: number | null = null
  if (pos >= 0) {
    prevNumber = pos > 0 ? visible[pos - 1]!.number : null
    nextNumber = pos < visible.length - 1 ? visible[pos + 1]!.number : null
  }

  try {
    const source = await mdxSerialize(discussion.body)
    const created_at = discussionDisplayDate({
      title: discussion.title,
      createdAt: discussion.createdAt,
    })

    return {
      props: {
        title: discussion.title,
        url: discussion.url,
        created_at,
        number,
        source,
        labels: discussion.labels?.nodes ?? [],
        prevNumber,
        nextNumber,
      },
    }
  } catch (e) {
    console.error(e)
    return { notFound: true }
  }
}

function ChangelogV3DetailPage({
  title,
  url,
  created_at,
  number,
  source,
  labels,
  prevNumber,
  nextNumber,
}: PageProps) {
  return (
    <>
      <NextSeo
        title={`${title} · Changelog`}
        description={title}
        openGraph={{
          title,
          url: `https://supabase.com/changelog/${number}`,
          type: 'article',
        }}
      />
      <DefaultLayout>
        <div className="container mx-auto max-w-3xl flex flex-col gap-4 px-4 py-10 sm:px-16 xl:px-20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <nav
              aria-label="Breadcrumb"
              className="text-foreground-lighter flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
            >
              <Link href="/changelog" className="text-foreground-lighter hover:underline">
                Changelog
              </Link>
            </nav>
            <ChangelogRssButton />
          </div>
          <header className="border-default flex flex-col gap-2 border-b pb-6">
            <h1 className="h1 text-2xl sm:text-3xl">{title}</h1>
            <div className="flex items-center justify-between gap-2">
              <p className="text-foreground-lighter font-mono text-xs">
                {dayjs(created_at).format('MMM D, YYYY')}
              </p>
              <Link
                target="_blank"
                href={url}
                className="flex items-center gap-2 text-sm text-foreground-lighter hover:text-foreground-light"
                rel="noreferrer"
              >
                View discussion on GitHub
                <ArrowUpRightIcon size={14} />
              </Link>
            </div>
          </header>

          <LabelBadges labels={labels} onBadgeClick={(e) => e.stopPropagation()} className="" />

          <article className="prose prose-docs max-w-none [overflow-wrap:break-word]">
            <MDXRemote {...source} components={mdxComponents('blog')} />
          </article>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-6">
            {nextNumber != null ? (
              <Link
                href={`/changelog/${nextNumber}`}
                className="text-foreground-lighter flex items-center gap-2 text-sm hover:text-foreground"
              >
                <ArrowLeftIcon className="h-4 w-4" /> Newer
              </Link>
            ) : (
              <span />
            )}
            {prevNumber != null ? (
              <Link
                href={`/changelog/${prevNumber}`}
                className="text-foreground-lighter flex items-center gap-2 text-sm hover:text-foreground"
              >
                Older
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            ) : (
              <span />
            )}
          </div>
        </div>
        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export default ChangelogV3DetailPage
