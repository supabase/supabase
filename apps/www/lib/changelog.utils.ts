import changelogProductTags from '~/data/changelog-product-tags.json'

import type { ChangelogTimelineIndexItem } from './changelog-github'

// hackery to fix Terry accidentally deleting
// a bunch of releases and their associted discussions in Dec 2023
// checks if titles match and grabs this original createdAt timestamp
//
// When editing entries with `createdAt`, also sync `scripts/data/changelog-deleted-discussions.json`
// (title + createdAt only) — used by generateStaticContent.mjs for changelog-rss.xml.
export const deletedDiscussions = [
  {
    title: 'Platform updates: October 2023',
    oldNumber: 18759,
    newNumber: 19705,
    createdAt: '2023-11-06T16:25:12Z',
  },
  {
    title: 'Platform update September 2023',
    oldNumber: 17975,
    newNumber: 19706,
    createdAt: '2023-10-06T09:23:56Z',
  },
  {
    title: 'Platform updates: August 2023',
    oldNumber: 17274,
    newNumber: 19704,
    createdAt: '2023-09-08T13:00:39Z',
  },
  {
    title: 'Platform updates June 2023',
    oldNumber: 15623,
    newNumber: 19703,
    createdAt: '2023-07-07T16:09:32Z',
  },
  {
    title: 'Platform updates: May 2023',
    oldNumber: 14941,
    newNumber: 19702,
    createdAt: '2023-06-09T16:40:16Z',
  },
  {
    title: 'Platform updates: April 2023',
    oldNumber: 14271,
    newNumber: 19701,
    createdAt: '2023-05-10T18:40:02Z',
  },
  {
    title: 'Platform Update February 2023',
    oldNumber: 12915,
    newNumber: 19700,
    createdAt: '2023-03-09T12:06:01Z',
  },
  {
    title: 'Platform update January 2023',
    oldNumber: 12268,
    newNumber: 19699,
    createdAt: '2023-02-08T18:29:41Z',
  },
  {
    title: 'Platform Updates November 2022',
    oldNumber: 10803,
    newNumber: 19698,
    createdAt: '2022-12-08T12:00:48Z',
  },
  {
    title: 'Platform updates: October 2022',
    oldNumber: 10036,
    newNumber: 19697,
    createdAt: '2022-11-02T16:07:47Z',
  },
  {
    title: 'Platform Update September 2022',
    oldNumber: 9388,
    newNumber: 19696,
    createdAt: '2022-10-07T10:18:21Z',
  },
  {
    title: 'Platform Update August 2022',
  },
  {
    title: 'Platform updates: 30 Nov 2021',
    oldNumber: 4169,
    newNumber: 19695,
    createdAt: '2021-11-30T10:06:55Z',
  },
  {
    title: 'October Beta 2021',
    oldNumber: 3830,
    newNumber: 19694,
    createdAt: '2021-11-08T13:14:35Z',
  },
  {
    title: 'September Beta 2021',
    oldNumber: 3417,
    newNumber: 19693,
    createdAt: '2021-10-04T18:10:57Z',
  },
  {
    title: 'August Beta 2021',
    oldNumber: 3184,
    newNumber: 19692,
    createdAt: '2021-09-13T09:47:18Z',
  },
  {
    title: 'July Beta 2021',
    oldNumber: 2815,
    newNumber: 19691,
    createdAt: '2021-08-12T13:46:14Z',
  },
  {
    title: 'June Beta 2021',
    oldNumber: 2216,
    newNumber: 19690,
    createdAt: '2021-07-04T13:23:35Z',
  },
  {
    title: 'May Beta 2021',
    oldNumber: 1912,
    newNumber: 19689,
    createdAt: '2021-06-10T11:53:14Z',
  },
  {
    title: 'April Beta 2021',
    oldNumber: 1433,
    newNumber: 19688,
    createdAt: '2021-05-05T05:17:27Z',
  },
]

export function discussionDisplayDate(item: { title: string; createdAt: string }) {
  const dateRewrite = deletedDiscussions.find(
    (rewrite) => item.title && rewrite.title && item.title.includes(rewrite.title)
  )
  return dateRewrite ? dateRewrite.createdAt : item.createdAt
}

const CHANGELOG_LABEL_DISPLAY_NAME: Record<string, string> = {
  documentation: 'docs',
  frontend: 'dashboard',
  javascript: 'supabase-js',
  swift: 'supabase-swift',
  flutter: 'supabase-flutter',
  python: 'supabase-py',
}

/** Returns the display name for a GitHub label, falling back to the original name. */
export function changelogLabelDisplayName(name: string): string {
  return CHANGELOG_LABEL_DISPLAY_NAME[name.toLowerCase()] ?? name
}

const GITHUB_CHANGELOG_DISCUSSIONS_BASE =
  'https://github.com/orgs/supabase/discussions/categories/changelog'

/** Internal changelog index URL with preselected tag filter (nuqs `tags` param). */
export function changelogTagFilterUrl(labelName: string) {
  return `/changelog?tags=${encodeURIComponent(labelName.toLowerCase())}`
}

export const CHANGELOG_PRODUCT_TAGS = changelogProductTags as Array<{
  slug: string
  label: string
}>

const CHANGELOG_PRODUCT_SLUG_SET = new Set<string>(CHANGELOG_PRODUCT_TAGS.map((tag) => tag.slug))

export function isChangelogProductSlug(value: string) {
  return CHANGELOG_PRODUCT_SLUG_SET.has(value)
}

export function itemMatchesChangelogSearch(item: ChangelogTimelineIndexItem, query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true
  if (item.title.toLowerCase().includes(normalizedQuery)) return true
  return item.labels.some((label) => label.name.toLowerCase().includes(normalizedQuery))
}

export function itemMatchesChangelogSelectedTags(
  item: ChangelogTimelineIndexItem,
  selectedTags: Set<string>
) {
  if (selectedTags.size === 0) return true
  const labelNames = new Set(item.labels.map((label) => label.name.toLowerCase()))
  for (const slug of selectedTags) {
    if (labelNames.has(slug.toLowerCase())) return true
  }
  return false
}
