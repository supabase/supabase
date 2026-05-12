import { useBreakpoint } from 'common'
import dayjs from 'dayjs'
import { GitCommit, ListFilter, Rss, X } from 'lucide-react'
import type { GetServerSideProps } from 'next'
import { MDXClient } from 'next-mdx-remote-client/csr'
import type { SerializeResult as MDXRemoteSerializeResult } from 'next-mdx-remote-client/serialize'
import { NextSeo } from 'next-seo'
import Head from 'next/head'
import Link from 'next/link'
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs'
import { NuqsAdapter } from 'nuqs/adapters/next/pages'
import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, cn, IconYCombinator, Input_Shadcn_ } from 'ui'

import { ChangelogLlmMarkdownButton } from '@/components/Changelog/ChangelogLlmMarkdownButton'
import { ChangelogTimelineList } from '@/components/Changelog/ChangelogTimelineList'
import CTABanner from '@/components/CTABanner'
import DefaultLayout from '@/components/Layouts/Default'
import changelogProductTags from '@/data/changelog-product-tags.json'
import {
  createChangelogOctokit,
  fetchChangelogDiscussionByNumber,
  getChangelogTimelineSortedIndex,
  type ChangelogLabel,
  type ChangelogTimelineIndexItem,
} from '@/lib/changelog-github'
import {
  CHANGELOG_PRODUCT_TAGS,
  changelogLabelDisplayName,
  changelogTagFilterUrl,
  discussionDisplayDate,
  isChangelogProductSlug,
  itemMatchesChangelogSearch,
  itemMatchesChangelogSelectedTags,
} from '@/lib/changelog.utils'
import mdxComponents from '@/lib/mdx/mdxComponents'
import { mdxSerialize } from '@/lib/mdx/mdxSerialize'

const FEATURED_COUNT = 3

type FeaturedEntry = {
  number: number
  slug: string
  title: string
  url: string
  created_at: string
  source: MDXRemoteSerializeResult
  labels: ChangelogLabel[]
}

type PageProps = {
  featured: FeaturedEntry[]
  restIndex: ChangelogTimelineIndexItem[]
  allIndex: ChangelogTimelineIndexItem[]
}

export const getServerSideProps: GetServerSideProps<PageProps> = async ({ res }) => {
  try {
    const changelogIndex = await getChangelogTimelineSortedIndex()
    const visible = changelogIndex.filter((item) => !item.title.includes('[d]'))
    const allIndex = visible
    const firstMeta = visible.slice(0, FEATURED_COUNT)
    const restIndex = visible.slice(FEATURED_COUNT)

    const octokit = createChangelogOctokit()
    const featuredResults = await Promise.all(
      firstMeta.map(
        async (meta): Promise<FeaturedEntry | { failedMeta: ChangelogTimelineIndexItem }> => {
          try {
            const discussion = await fetchChangelogDiscussionByNumber(
              octokit,
              'supabase',
              'supabase',
              meta.number
            )
            if (!discussion) return { failedMeta: meta }
            const source = await mdxSerialize(discussion.body)
            const created_at =
              discussionDisplayDate({
                title: discussion.title,
                createdAt: discussion.createdAt,
              }) ?? discussion.createdAt
            return {
              number: meta.number,
              slug: meta.slug,
              title: discussion.title,
              url: discussion.url ?? '',
              created_at,
              source,
              labels: meta.labels,
            }
          } catch (e) {
            console.error(e)
            return { failedMeta: meta }
          }
        }
      )
    )

    const featured = featuredResults.filter((e): e is FeaturedEntry => !('failedMeta' in e))
    const fallbackItems = featuredResults
      .filter((e): e is { failedMeta: ChangelogTimelineIndexItem } => 'failedMeta' in e)
      .map((e) => e.failedMeta)
    const restIndexWithFallbacks = fallbackItems.concat(restIndex)

    res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=900')
    return { props: { featured, restIndex: restIndexWithFallbacks, allIndex } }
  } catch (e) {
    console.error(e)
    res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate')
    return { props: { featured: [], restIndex: [], allIndex: [] } }
  }
}

export default function ChangelogPage(props: PageProps) {
  return (
    <NuqsAdapter>
      <ChangelogIndex {...props} />
    </NuqsAdapter>
  )
}

const nuqsUrlOptions = { shallow: true, history: 'push' as const }

function ChangelogIndex({ featured, restIndex, allIndex }: PageProps) {
  const [querySearch, setQuerySearch] = useQueryState(
    'q',
    parseAsString.withOptions(nuqsUrlOptions)
  )
  const [queryTags, setQueryTags] = useQueryState(
    'tags',
    parseAsArrayOf(parseAsString).withOptions(nuqsUrlOptions)
  )

  const isMobile = useBreakpoint('lg')
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)

  const filterSearch = querySearch ?? ''
  const selectedTags = useMemo(() => {
    const next = new Set<string>()
    for (const raw of queryTags ?? []) {
      if (isChangelogProductSlug(raw)) next.add(raw)
    }
    return next
  }, [queryTags])

  const hasNuqsFilters = useMemo(
    () => filterSearch.trim().length > 0 || selectedTags.size > 0,
    [filterSearch, selectedTags]
  )

  useEffect(() => {
    if (hasNuqsFilters) setFilterPanelOpen(true)
  }, [hasNuqsFilters])

  const filteredIndex = useMemo(() => {
    const q = filterSearch
    const hasSearch = q.trim().length > 0
    const hasTags = selectedTags.size > 0
    if (!hasSearch && !hasTags) return null
    return allIndex
      .filter(
        (item) =>
          itemMatchesChangelogSearch(item, q) &&
          itemMatchesChangelogSelectedTags(item, selectedTags)
      )
      .sort((a, b) => dayjs(b.sortDate).diff(dayjs(a.sortDate)))
  }, [allIndex, filterSearch, selectedTags])

  const toggleProductTag = (slug: string) => {
    const current = (queryTags ?? []).filter(isChangelogProductSlug)
    const has = current.includes(slug)
    const next = has ? current.filter((t) => t !== slug) : [...current, slug]
    void setQueryTags(next.length > 0 ? next : null)
  }

  const clearFilters = () => {
    void setQuerySearch(null)
    void setQueryTags(null)
  }

  const isSingleQueryTag = queryTags?.length === 1

  const TITLE = 'Changelog'
  const DESCRIPTION = 'New updates and improvements to Supabase'

  return (
    <>
      <Head>
        <link rel="alternate" type="text/markdown" href="/changelog.md" />
      </Head>
      <NextSeo
        title={TITLE}
        description={DESCRIPTION}
        openGraph={{
          title: TITLE,
          description: DESCRIPTION,
          url: 'https://supabase.com/changelog',
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
              <div className="w-full lg:w-auto flex flex-wrap items-center gap-1">
                <div className="flex-1">
                  <Button
                    type="default"
                    size="tiny"
                    className={cn('shrink-0', !filterPanelOpen && 'px-1.5')}
                    aria-expanded={filterPanelOpen}
                    aria-controls="changelog-filters"
                    title="Filter changelog"
                    icon={
                      filterPanelOpen ? (
                        <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                      ) : (
                        <ListFilter className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                      )
                    }
                    onClick={() => {
                      if (filterPanelOpen) setFilterPanelOpen(false)
                      else setFilterPanelOpen(true)
                    }}
                  >
                    {filterPanelOpen ? 'Hide filters' : isMobile && 'Filter changelog'}
                  </Button>
                </div>
                <Button
                  asChild
                  type="default"
                  className="shrink-0"
                  icon={<Rss className="h-4 w-4" strokeWidth={2} aria-hidden />}
                >
                  <Link
                    href={
                      isSingleQueryTag
                        ? `/changelog-rss/${queryTags?.[0]}.xml`
                        : '/changelog-rss.xml'
                    }
                  >
                    {isSingleQueryTag &&
                      changelogProductTags.find((tag) => tag.slug === queryTags?.[0])?.label +
                        ' '}{' '}
                    RSS
                  </Link>
                </Button>
                <ChangelogLlmMarkdownButton />
              </div>
            </div>
          </div>

          {filterPanelOpen && (
            <div id="changelog-filters" className="flex flex-col gap-2 -mt-4 sm:mx-0">
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
                    onChange={(e) => {
                      const v = e.target.value
                      void setQuerySearch(v.length === 0 ? null : v)
                    }}
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
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-foreground-lighter text-sm">No entries match your filters.</p>
                  {!filterPanelOpen && (
                    <Button
                      type="text"
                      size="tiny"
                      className="shrink-0"
                      icon={<X className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
                      onClick={clearFilters}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="text-foreground-lighter mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <p>
                      {filteredIndex.length} {filteredIndex.length === 1 ? 'result' : 'results'}
                    </p>
                    {!filterPanelOpen && (
                      <Button
                        type="text"
                        size="tiny"
                        className="shrink-0"
                        icon={<X className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
                        onClick={clearFilters}
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                  <ChangelogTimelineList items={filteredIndex} />
                </>
              )}
            </section>
          ) : (
            <section
              className="border-muted relative lg:ml-2 lg:border-l lg:pl-8 mb-12 lg:mb-20"
              aria-label="Changelog timeline"
            >
              <div className="grid">
                {featured.map((entry) => (
                  <div
                    key={entry.number}
                    id={entry.number.toString()}
                    className="grid pb-12 lg:grid-cols-12 lg:gap-8 lg:pb-36 scroll-mt-32"
                  >
                    <div className="col-span-12 lg:ml-[-31px] mb-8 lg:mb-0 self-start z-10 sticky top-[65px] lg:top-32 lg:col-span-4">
                      <div className="flex w-full items-baseline relative bg-background pt-4 lg:pt-0 border-b pb-4 lg:gap-4 lg:border-none lg:pb-0">
                        <div className="hidden lg:flex bg-border border-muted text-foreground-lighter -ml-2.5 h-5 w-5 items-center justify-center rounded-sm border drop-shadow-xs">
                          <GitCommit size={14} strokeWidth={1.5} />
                        </div>
                        <div className="flex w-full flex-col gap-1">
                          {entry.title && (
                            <Link href={`/changelog/${entry.slug}`}>
                              <h3 className="text-foreground text-lg hover:underline">
                                {entry.title}
                              </h3>
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
                                  href={changelogTagFilterUrl(label.name)}
                                  className="group inline-flex no-underline focus-visible:ring-brand-default rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
                                >
                                  <Badge className="group-hover:text-foreground-light text-foreground-lighter group-hover:border-foreground-muted px-1.5 py-px text-[11px] tracking-normal lowercase">
                                    {changelogLabelDisplayName(label.name)}
                                  </Badge>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-8 lg:max-w-[calc(100vw-80px)]">
                      <article className="prose prose-docs max-w-none wrap-break-word [&>*:first-child:not(style):not(script)]:mt-0 [&>style:first-child+*]:mt-0 [&>script:first-child+*]:mt-0 [&>*:last-child:not(style):not(script)]:mb-0">
                        {'error' in entry.source ? (
                          <p>Error rendering changelog: {entry.source.error.message}</p>
                        ) : (
                          <MDXClient {...entry.source} components={mdxComponents('blog')} />
                        )}
                      </article>
                    </div>
                  </div>
                ))}
              </div>

              {restIndex.length > 0 && (
                <section aria-label="Earlier changelog entries" className="lg:pb-20">
                  <ChangelogTimelineList items={restIndex} omitOuterTimelineBorder />
                </section>
              )}
              <div className="hidden lg:grid">
                <div className="col-span-12 -ml-8 mb-8 lg:mb-0 self-start lg:sticky lg:top-0 lg:col-span-4 lg:-mt-20 lg:pt-20">
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
            </section>
          )}
        </div>
        <CTABanner />
      </DefaultLayout>
    </>
  )
}
