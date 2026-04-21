import { ChangelogRssButton } from '~/components/Changelog/ChangelogRssButton'
import {
  ChangelogV3TimelineFlatList,
  ChangelogV3TimelineList,
} from '~/components/Changelog/ChangelogV3TimelineList'
import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import {
  createChangelogOctokit,
  fetchChangelogDiscussionByNumber,
  getChangelogTimelineSortedIndex,
  type ChangelogLabel,
  type ChangelogTimelineIndexItem,
} from '~/lib/changelog-github'
import { discussionDisplayDate, githubChangelogLabelFilterUrl } from '~/lib/changelog.utils'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { mdxSerialize } from '~/lib/mdx/mdxSerialize'
import dayjs from 'dayjs'
import { GitCommit, ListFilter, X } from 'lucide-react'
import type { GetServerSideProps } from 'next'
import type { MDXRemoteSerializeResult } from 'next-mdx-remote'
import { MDXRemote } from 'next-mdx-remote'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { parseAsInteger, useQueryState } from 'nuqs'
import { NuqsAdapter } from 'nuqs/adapters/next/pages'
import { useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  IconYCombinator,
  Input,
  Input_Shadcn_,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import 'ui-patterns/ShimmeringLoader/index.css'

const FEATURED_COUNT = 5

/** GitHub changelog label slugs used for product filters. */
const CHANGELOG_PRODUCT_TAGS = [
  { slug: 'storage', label: 'Storage' },
  { slug: 'database', label: 'Database' },
  { slug: 'realtime', label: 'Realtime' },
  { slug: 'edge-functions', label: 'Edge Functions' },
  { slug: 'auth', label: 'Auth' },
  { slug: 'sdk', label: 'SDK' },
  { slug: 'self-hosted', label: 'Self-hosted' },
  { slug: 'vector', label: 'Vector' },
  { slug: 'billing', label: 'Billing' },
  { slug: 'breaking-change', label: 'Breaking Change' },
  { slug: 'cli', label: 'CLI' },
  { slug: 'infra', label: 'Infra' },
  { slug: 'dashboard', label: 'Dashboard' },
  { slug: 'docs', label: 'Docs' },
] as const

type FeaturedEntry = {
  number: number
  title: string
  url: string
  created_at: string
  source: MDXRemoteSerializeResult
  labels: ChangelogLabel[]
}

type ModalPayload = {
  title: string
  url: string
  created_at: string
  source: MDXRemoteSerializeResult
}

type PageProps = {
  featured: FeaturedEntry[]
  restIndex: ChangelogTimelineIndexItem[]
  /** Full sorted index (visible only), for client-side filtering. */
  allIndex: ChangelogTimelineIndexItem[]
}

export const getServerSideProps: GetServerSideProps<PageProps> = async ({ res }) => {
  res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=900')

  try {
    const changelogIndex = await getChangelogTimelineSortedIndex()
    const visible = changelogIndex.filter((item) => !item.title.includes('[d]'))
    const allIndex = visible
    const firstMeta = visible.slice(0, FEATURED_COUNT)
    const restIndex = visible.slice(FEATURED_COUNT)

    const octokit = createChangelogOctokit()
    const featured = (
      await Promise.all(
        firstMeta.map(async (meta): Promise<FeaturedEntry | null> => {
          try {
            const discussion = await fetchChangelogDiscussionByNumber(
              octokit,
              'supabase',
              'supabase',
              meta.number
            )
            if (!discussion) return null
            const source = await mdxSerialize(discussion.body)
            const created_at =
              discussionDisplayDate({
                title: discussion.title,
                createdAt: discussion.createdAt,
              }) ?? discussion.createdAt
            return {
              number: meta.number,
              title: discussion.title,
              url: discussion.url ?? '',
              created_at,
              source,
              labels: meta.labels,
            }
          } catch (e) {
            console.error(e)
            return null
          }
        })
      )
    ).filter((e): e is FeaturedEntry => e != null)

    return { props: { featured, restIndex, allIndex } }
  } catch (e) {
    console.error(e)
    return { props: { featured: [], restIndex: [], allIndex: [] } }
  }
}

export default function ChangelogProgressivePage(props: PageProps) {
  return (
    <NuqsAdapter>
      <ChangelogProgressiveContent {...props} />
    </NuqsAdapter>
  )
}

function itemMatchesSearch(item: ChangelogTimelineIndexItem, q: string) {
  const n = q.trim().toLowerCase()
  if (!n) return true
  if (item.title.toLowerCase().includes(n)) return true
  return item.labels.some((l) => l.name.toLowerCase().includes(n))
}

function itemMatchesSelectedTags(
  item: ChangelogTimelineIndexItem,
  selected: Set<(typeof CHANGELOG_PRODUCT_TAGS)[number]['slug']>
) {
  if (selected.size === 0) return true
  const labelNames = new Set(item.labels.map((l) => l.name.toLowerCase()))
  for (const slug of selected) {
    if (labelNames.has(slug.toLowerCase())) return true
  }
  return false
}

function ChangelogProgressiveContent({ featured, restIndex, allIndex }: PageProps) {
  const [discussion, setDiscussion] = useQueryState(
    'discussion',
    parseAsInteger.withOptions({ shallow: true, history: 'push' })
  )

  const [payload, setPayload] = useState<ModalPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [filterSearch, setFilterSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<
    Set<(typeof CHANGELOG_PRODUCT_TAGS)[number]['slug']>
  >(() => new Set())

  const filteredIndex = useMemo(() => {
    const q = filterSearch
    const hasSearch = q.trim().length > 0
    const hasTags = selectedTags.size > 0
    if (!hasSearch && !hasTags) return null
    return allIndex
      .filter((item) => itemMatchesSearch(item, q) && itemMatchesSelectedTags(item, selectedTags))
      .sort((a, b) => dayjs(b.sortDate).diff(dayjs(a.sortDate)))
  }, [allIndex, filterSearch, selectedTags])

  const toggleProductTag = (slug: (typeof CHANGELOG_PRODUCT_TAGS)[number]['slug']) => {
    setSelectedTags((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  const clearFilters = () => {
    setFilterSearch('')
    setSelectedTags(new Set())
  }

  const preview = useMemo(() => {
    if (discussion == null) return null
    const fromFeatured = featured.find((e) => e.number === discussion)
    if (fromFeatured) {
      return {
        title: fromFeatured.title,
        url: fromFeatured.url,
        dateIso: fromFeatured.created_at,
      }
    }
    const fromIndex = allIndex.find((e) => e.number === discussion)
    if (fromIndex) {
      return {
        title: fromIndex.title,
        url: fromIndex.url,
        dateIso: fromIndex.sortDate,
      }
    }
    return null
  }, [discussion, featured, allIndex])

  useEffect(() => {
    if (discussion == null) {
      setPayload(null)
      setError(null)
      setLoading(false)
      return
    }

    const entry = featured.find((e) => e.number === discussion)
    if (entry) {
      setPayload({
        title: entry.title,
        url: entry.url,
        created_at: entry.created_at,
        source: entry.source,
      })
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
  }, [discussion, featured])

  const open = discussion != null

  const handleOpenChange = (next: boolean) => {
    if (!next) void setDiscussion(null)
  }

  const displayTitle =
    preview?.title ?? payload?.title ?? (discussion != null ? `Discussion #${discussion}` : '')
  const displayDateIso = preview?.dateIso ?? payload?.created_at

  const handleSelectFromList = (item: ChangelogTimelineIndexItem) => {
    void setDiscussion(item.number)
  }

  const TITLE = 'Changelog'
  const DESCRIPTION = 'New updates and improvements to Supabase'

  return (
    <>
      <NextSeo
        title={TITLE}
        description={DESCRIPTION}
        openGraph={{
          title: TITLE,
          description: DESCRIPTION,
          url: 'https://supabase.com/changelog-progressive',
          type: 'article',
        }}
      />
      <DefaultLayout>
        <div className="container mx-auto max-w-5xl flex flex-col gap-8 px-4 py-10 sm:px-16 xl:px-20">
          <div className="pb-4">
            <h1 className="h1">Changelog</h1>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-foreground-lighter text-lg">
                New updates and product improvements
              </p>
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  type={filterPanelOpen ? 'default' : 'text'}
                  size="tiny"
                  className="shrink-0"
                  aria-expanded={filterPanelOpen}
                  aria-controls="changelog-progressive-filters"
                  icon={
                    filterPanelOpen ? (
                      <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                    ) : (
                      <ListFilter className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                    )
                  }
                  onClick={() => setFilterPanelOpen((o) => !o)}
                >
                  {filterPanelOpen ? 'Hide filters' : 'Filter changelog'}
                </Button>
                <ChangelogRssButton />
              </div>
            </div>
          </div>

          {filterPanelOpen && (
            <div id="changelog-progressive-filters" className="flex flex-col gap-2 -mt-4 sm:mx-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative min-w-0 flex-1">
                  <label htmlFor="changelog-filter-search" className="sr-only">
                    Search changelog
                  </label>
                  <Input_Shadcn_
                    id="changelog-filter-search"
                    size="small"
                    placeholder="Search changelog..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                  />
                  {(filterSearch.trim().length > 0 || selectedTags.size > 0) && (
                    <Button
                      type="outline"
                      size="tiny"
                      className="absolute inset-1 my-auto left-auto shrink-0"
                      onClick={clearFilters}
                      icon={<X className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <p className="sr-only">Filter by tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {CHANGELOG_PRODUCT_TAGS.map(({ slug, label }) => {
                    const on = selectedTags.has(slug)
                    return (
                      <button key={slug} type="button" onClick={() => toggleProductTag(slug)}>
                        <Badge
                          variant={on ? 'success' : 'default'}
                          className={cn(!on && 'hover:text-foreground')}
                        >
                          {label}
                        </Badge>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {filteredIndex != null ? (
            <section aria-label="Filtered changelog entries" className="min-w-0">
              {filteredIndex.length === 0 ? (
                <p className="text-foreground-lighter text-sm">No entries match your filters.</p>
              ) : (
                <>
                  <p className="text-foreground-lighter mb-3 text-sm">
                    {filteredIndex.length} {filteredIndex.length === 1 ? 'result' : 'results'}
                  </p>
                  <ChangelogV3TimelineFlatList
                    items={filteredIndex}
                    mode="action"
                    onSelect={handleSelectFromList}
                    showFullDate
                  />
                </>
              )}
            </section>
          ) : (
            <div
              className="border-muted relative lg:ml-2 lg:border-l lg:pl-8"
              aria-label="Changelog timeline"
            >
              <div className="grid">
                {featured.map((entry) => (
                  <div
                    key={entry.number}
                    id={entry.number.toString()}
                    className="grid pb-12 lg:grid-cols-12 lg:gap-8 lg:pb-36 scroll-mt-32"
                  >
                    <div className="col-span-12 lg:-ml-[31px] mb-8 lg:mb-0 self-start z-10 sticky top-[65px] lg:top-32 lg:col-span-4">
                      <div className="flex w-full items-baseline relative bg-background pt-4 lg:pt-0 border-b pb-4 lg:gap-4 lg:border-none lg:pb-0">
                        <div className="hidden lg:flex bg-border border-muted text-foreground-lighter -ml-2.5 h-5 w-5 items-center justify-center rounded border drop-shadow-sm">
                          <GitCommit size={14} strokeWidth={1.5} />
                        </div>
                        <div className="flex w-full flex-col gap-1">
                          {entry.title && (
                            <Link href={entry.url}>
                              <h3 className="text-foreground text-lg">{entry.title}</h3>
                            </Link>
                          )}
                          <p className="text-foreground-lighter font-mono text-xs">
                            {dayjs(entry.created_at).format('MMM D, YYYY')}
                          </p>
                          {entry.labels && entry.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1.5">
                              {entry.labels.map((label) => (
                                <a
                                  key={`${entry.number}-${label.name}`}
                                  href={githubChangelogLabelFilterUrl(label.name)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group inline-flex no-underline focus-visible:ring-brand-default rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                                >
                                  <Badge className="group-hover:text-foreground-light text-foreground-lighter group-hover:border-foreground-muted px-1.5 py-px text-[11px] lowercase">
                                    {label.name}
                                  </Badge>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-8 lg:max-w-[calc(100vw-80px)]">
                      <article className="prose prose-docs max-w-none [overflow-wrap:break-word]">
                        <MDXRemote {...entry.source} components={mdxComponents('blog')} />
                      </article>
                    </div>
                  </div>
                ))}
              </div>

              {restIndex.length > 0 && (
                <section aria-label="Earlier changelog entries" className="lg:pb-28">
                  <ChangelogV3TimelineList
                    items={restIndex}
                    mode="action"
                    onSelect={handleSelectFromList}
                    omitOuterTimelineBorder
                  />
                </section>
              )}
              <div className="hidden lg:grid">
                <div className="col-span-12 -ml-8 mb-8 lg:mb-0 self-start lg:sticky lg:top-0 lg:col-span-4 lg:-mt-32 lg:pt-32">
                  <div className="flex w-full items-baseline border-b pb-4 lg:gap-4 lg:border-none lg:pb-0">
                    <Link
                      href="https://www.ycombinator.com/companies/supabase"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden lg:flex -ml-2 text-foreground-lighter hover:text-foreground"
                      title="YCombinator —  Summer 2020"
                    >
                      <IconYCombinator size={16} className="text-current" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
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
