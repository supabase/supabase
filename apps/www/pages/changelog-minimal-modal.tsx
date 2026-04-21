import { ChangelogRssButton } from '~/components/Changelog/ChangelogRssButton'
import { ChangelogV3TimelineList } from '~/components/Changelog/ChangelogV3TimelineList'
import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import type { ChangelogTimelineIndexItem } from '~/lib/changelog-github'
import { getChangelogTimelineSortedIndex } from '~/lib/changelog-github'
import mdxComponents from '~/lib/mdx/mdxComponents'
import dayjs from 'dayjs'
import type { GetServerSideProps } from 'next'
import type { MDXRemoteSerializeResult } from 'next-mdx-remote'
import { MDXRemote } from 'next-mdx-remote'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { parseAsInteger, useQueryState } from 'nuqs'
import { NuqsAdapter } from 'nuqs/adapters/next/pages'
import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import 'ui-patterns/ShimmeringLoader/index.css'

type ModalPayload = {
  title: string
  url: string
  created_at: string
  source: MDXRemoteSerializeResult
}

type PageProps = {
  changelogIndex: ChangelogTimelineIndexItem[]
}

export const getServerSideProps: GetServerSideProps<PageProps> = async ({ res }) => {
  res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=900')
  try {
    const changelogIndex = await getChangelogTimelineSortedIndex()
    return { props: { changelogIndex } }
  } catch (e) {
    console.error(e)
    return { props: { changelogIndex: [] } }
  }
}

export default function ChangelogV3ModalPage(props: PageProps) {
  return (
    <NuqsAdapter>
      <ChangelogV3ModalContent {...props} />
    </NuqsAdapter>
  )
}

function ChangelogV3ModalContent({ changelogIndex }: PageProps) {
  const [discussion, setDiscussion] = useQueryState(
    'discussion',
    parseAsInteger.withOptions({ shallow: true, history: 'push' })
  )

  const [payload, setPayload] = useState<ModalPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const preview = useMemo(() => {
    if (discussion == null) return null
    return changelogIndex.find((i) => i.number === discussion) ?? null
  }, [discussion, changelogIndex])

  useEffect(() => {
    if (discussion == null) {
      setPayload(null)
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setPayload(null)

    void (async () => {
      try {
        const res = await fetch(`/api/changelog-discussion/${discussion}`)
        if (cancelled) return
        if (!res.ok) {
          setError(res.status === 404 ? 'Discussion not found.' : 'Could not load this entry.')
          return
        }
        const data = (await res.json()) as ModalPayload
        if (!cancelled) setPayload(data)
      } catch {
        if (!cancelled) setError('Network error.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [discussion])

  const open = discussion != null

  const handleOpenChange = (next: boolean) => {
    if (!next) void setDiscussion(null)
  }

  const displayTitle =
    preview?.title ?? payload?.title ?? (discussion != null ? `Discussion #${discussion}` : '')
  const displayDateIso = preview?.sortDate ?? payload?.created_at
  const displayUrl = preview?.url ?? payload?.url

  const visible = changelogIndex.filter((item) => !item.title.includes('[d]'))

  return (
    <>
      <NextSeo
        title="Changelog"
        description="New updates and improvements to Supabase"
        openGraph={{
          title: 'Changelog',
          url: 'https://supabase.com/changelog-v3-modal',
          type: 'article',
        }}
      />
      <DefaultLayout>
        <div className="container mx-auto max-w-3xl flex flex-col gap-6 px-4 py-10 sm:px-16 xl:px-20">
          <div>
            <h1 className="h1">Changelog</h1>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-foreground-lighter text-lg">
                New updates and product improvements
              </p>
              <ChangelogRssButton />
            </div>
          </div>

          <section aria-label="Changelog entries">
            {visible.length === 0 ? (
              <p className="text-foreground-lighter text-sm">No entries loaded.</p>
            ) : (
              <ChangelogV3TimelineList
                items={visible}
                mode="action"
                onSelect={(item) => void setDiscussion(item.number)}
              />
            )}
          </section>
        </div>
        <CTABanner />
      </DefaultLayout>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="flex max-h-[min(90vh,900px)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <div className="bg-dash-sidebar sticky top-0 shrink-0 border-b border-default">
            <DialogHeader className="border-0">
              <DialogTitle className="pr-8 text-left text-xl">{displayTitle}</DialogTitle>
              <DialogDescription asChild>
                <div className="text-foreground-lighter flex flex-col gap-2 text-left">
                  {displayDateIso && (
                    <p className="font-mono text-xs">
                      {dayjs(displayDateIso).format('MMM D, YYYY')}
                    </p>
                  )}
                  {error && <span className="text-destructive-600 text-sm">{error}</span>}
                </div>
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-2 md:px-5">
            {loading && <GenericSkeletonLoader className="py-2" />}
            {!loading && payload?.source && (
              <article className="prose prose-docs max-w-none [overflow-wrap:break-word]">
                <MDXRemote {...payload.source} components={mdxComponents('blog')} />
              </article>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
