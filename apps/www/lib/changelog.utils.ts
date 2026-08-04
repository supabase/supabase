import changelogProductTags from '~/data/changelog-product-tags.json'

import { CHANGE_TYPE_LABELS } from './changelog-entries-core.mjs'
import type { ChangelogEntry, ChangeType } from './changelog-repo'

export type ChangelogTimelineIndexItem = {
  slug: string
  title: string
  summary: string
  sortDate: string
  changeType: ChangeType
  affectedProducts: string[]
  productStage: string | null
  affectsSelfHosted: boolean | null
}

export function toChangelogTimelineIndexItem(entry: ChangelogEntry): ChangelogTimelineIndexItem {
  return {
    slug: entry.slug,
    title: entry.frontmatter.title,
    summary: entry.summary,
    sortDate: entry.sortDate,
    changeType: entry.frontmatter.change_type,
    affectedProducts: entry.frontmatter.affected_products ?? [],
    productStage: entry.frontmatter.product_stage ?? null,
    affectsSelfHosted: entry.frontmatter.affects_self_hosted ?? null,
  }
}

/** Strips inline markdown from a title for plain-text contexts (`<title>`, meta, Open Graph). */
export function stripTitleMarkdown(title: string) {
  return title
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links / images
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/`+([^`]*)`+/g, '$1') // inline code
    .trim()
}

const CHANGE_TYPE_BADGE_VARIANT: Record<
  ChangeType,
  'default' | 'warning' | 'success' | 'destructive'
> = {
  'breaking-change': 'destructive',
  deprecation: 'warning',
  'new-feature': 'success',
  improvement: 'default',
  'bug-fix': 'warning',
  security: 'destructive',
  policy: 'default',
}

export const CHANGE_TYPE_DISPLAY: Record<
  ChangeType,
  { label: string; badgeVariant: 'default' | 'warning' | 'success' | 'destructive' }
> = Object.fromEntries(
  (Object.keys(CHANGE_TYPE_LABELS) as ChangeType[]).map((type) => [
    type,
    { label: CHANGE_TYPE_LABELS[type], badgeVariant: CHANGE_TYPE_BADGE_VARIANT[type] },
  ])
) as Record<
  ChangeType,
  { label: string; badgeVariant: 'default' | 'warning' | 'success' | 'destructive' }
>

/** Internal changelog index URL with preselected tag filter (nuqs `tags` param). */
export function changelogTagFilterUrl(productSlug: string) {
  return `/changelog?tags=${encodeURIComponent(productSlug.toLowerCase())}`
}

/** Internal changelog index URL with preselected change-type filter (nuqs `types` param). */
export function changelogTypeFilterUrl(changeType: ChangeType) {
  return `/changelog?types=${encodeURIComponent(changeType)}`
}

export const CHANGE_TYPES = Object.keys(CHANGE_TYPE_DISPLAY) as ChangeType[]

export const CHANGELOG_PRODUCT_TAGS = changelogProductTags as Array<{
  slug: string
  label: string
}>

const CHANGELOG_PRODUCT_SLUG_SET = new Set<string>(CHANGELOG_PRODUCT_TAGS.map((tag) => tag.slug))

export function isChangelogProductSlug(value: string) {
  return CHANGELOG_PRODUCT_SLUG_SET.has(value)
}

export function isChangelogChangeType(value: string): value is ChangeType {
  return Object.prototype.hasOwnProperty.call(CHANGE_TYPE_DISPLAY, value)
}

/** Matches the `product_stage` enum in supabase/changelog's entry schema. */
export const CHANGELOG_PRODUCT_STAGES = [
  { slug: 'private-alpha', label: 'Private Alpha' },
  { slug: 'public-alpha', label: 'Public Alpha' },
  { slug: 'beta', label: 'Beta' },
  { slug: 'public-beta', label: 'Public Beta' },
  { slug: 'general-availability', label: 'General Availability' },
] as const

const CHANGELOG_PRODUCT_STAGE_SLUG_SET = new Set<string>(
  CHANGELOG_PRODUCT_STAGES.map((stage) => stage.slug)
)

export function isChangelogProductStageSlug(value: string) {
  return CHANGELOG_PRODUCT_STAGE_SLUG_SET.has(value)
}

function productStageToSlug(productStage: string) {
  return productStage.toLowerCase().replace(/\s+/g, '-')
}

export const CHANGELOG_SELF_HOSTED_OPTIONS = [
  { slug: 'yes', label: 'Affects self-hosted' },
  { slug: 'no', label: "Doesn't affect self-hosted" },
] as const

const CHANGELOG_SELF_HOSTED_SLUG_SET = new Set<string>(
  CHANGELOG_SELF_HOSTED_OPTIONS.map((option) => option.slug)
)

export function isChangelogSelfHostedSlug(value: string) {
  return CHANGELOG_SELF_HOSTED_SLUG_SET.has(value)
}

export function itemMatchesChangelogSearch(item: ChangelogTimelineIndexItem, query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true
  if (item.title.toLowerCase().includes(normalizedQuery)) return true
  return item.affectedProducts.some((product) => product.toLowerCase().includes(normalizedQuery))
}

export function itemMatchesChangelogSelectedTags(
  item: ChangelogTimelineIndexItem,
  selectedTags: Set<string>
) {
  if (selectedTags.size === 0) return true
  const productSlugs = new Set(item.affectedProducts.map((product) => product.toLowerCase()))
  for (const slug of selectedTags) {
    if (productSlugs.has(slug.toLowerCase())) return true
  }
  return false
}

export function itemMatchesChangelogSelectedTypes(
  item: ChangelogTimelineIndexItem,
  selectedTypes: Set<ChangeType>
) {
  if (selectedTypes.size === 0) return true
  return selectedTypes.has(item.changeType)
}

export function itemMatchesChangelogSelectedStages(
  item: ChangelogTimelineIndexItem,
  selectedStages: Set<string>
) {
  if (selectedStages.size === 0) return true
  if (!item.productStage) return false
  return selectedStages.has(productStageToSlug(item.productStage))
}

export function itemMatchesChangelogSelectedSelfHosted(
  item: ChangelogTimelineIndexItem,
  selectedSelfHosted: Set<string>
) {
  if (selectedSelfHosted.size === 0) return true
  const key = item.affectsSelfHosted === true ? 'yes' : 'no'
  return selectedSelfHosted.has(key)
}
