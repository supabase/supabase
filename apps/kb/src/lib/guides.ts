import type { CollectionEntry } from 'astro:content'

import { FORMAT_TOPICS, isKnownTopic, TOPICS, topicToSlug, type Topic } from './topics'

export interface GuideSummary {
  id: string
  title: string
  description: string
  topics: Topic[]
  href: string
  date?: string
}

export interface FeaturedItem extends GuideSummary {
  slot: string
}

interface FilterGuidesParams {
  guides: GuideSummary[]
  topic: Topic | null
}

interface PadFeaturedParams {
  featured: Omit<FeaturedItem, 'slot'>[]
  fallback: Omit<FeaturedItem, 'slot'>[]
  count?: number
}

interface EmptyStateParams {
  topic: Topic | null
}

export interface EmptyState {
  message: string
  action: string
}

interface RelatedGuidesParams {
  guide: GuideSummary
  guides: GuideSummary[]
}

export interface RelatedGuides {
  topic: Topic
  guides: GuideSummary[]
}

const FEATURED_COUNT = 3
const RELATED_COUNT = 3

export const toSummary = (guide: CollectionEntry<'guides'>): GuideSummary => ({
  id: guide.id,
  title: guide.data.title,
  description: guide.data.description,
  topics: guide.data.topics,
  href: `${import.meta.env.BASE_URL}/guides/${guide.id}`,
  date: guide.data.date,
})

export const toTroubleshootingSummary = (
  entry: CollectionEntry<'troubleshooting'>
): GuideSummary => ({
  id: entry.id,
  title: entry.data.title,
  description: entry.data.description ?? '',
  topics: entry.data.topics.filter(isKnownTopic),
  href: `${import.meta.env.BASE_URL}/troubleshooting/${entry.id}`,
})

export const filterGuides = ({ guides, topic }: FilterGuidesParams): GuideSummary[] =>
  topic ? guides.filter((guide) => guide.topics.includes(topic)) : guides

export const padFeatured = ({
  featured,
  fallback,
  count = FEATURED_COUNT,
}: PadFeaturedParams): FeaturedItem[] => {
  const source = featured.length > 0 ? featured : fallback
  if (source.length === 0) return []

  return Array.from({ length: count }, (_, slotIndex) => {
    const guide = source[slotIndex % source.length]
    return { ...guide, slot: `${guide.id}-${slotIndex}` }
  })
}

export const parseTopicParam = (slug: string | null): Topic | null =>
  TOPICS.find((topic) => topicToSlug(topic.name) === slug)?.name ?? null

export const withTopicParam = ({
  search,
  topic,
}: {
  search: string
  topic: Topic | null
}): string => {
  const params = new URLSearchParams(search)
  if (topic) params.set('topic', topicToSlug(topic))
  else params.delete('topic')
  const next = params.toString()
  return next ? `?${next}` : ''
}

export const emptyStateFor = ({ topic }: EmptyStateParams): EmptyState => {
  const topicLabel = topic ? `${topic} ` : ''
  return {
    message: `There are no ${topicLabel}guides yet.`,
    action: 'Show all guides',
  }
}

export const relatedGuides = ({ guide, guides }: RelatedGuidesParams): RelatedGuides | null => {
  const sharedTopics = (other: GuideSummary) =>
    other.topics.filter((topic) => guide.topics.includes(topic)).length
  // readers want more on the same subject, not more of the same kind of guide
  const subjectFirst = guide.topics.toSorted(
    (a, b) => Number(FORMAT_TOPICS.includes(a)) - Number(FORMAT_TOPICS.includes(b))
  )
  for (const topic of subjectFirst) {
    // hidden topics target crawlers, not readers, so they never name the section
    if (!TOPICS.find(({ name }) => name === topic)?.visible) continue
    const others = guides.filter((other) => other.id !== guide.id && other.topics.includes(topic))
    if (others.length === 0) continue
    const ranked = others.toSorted((a, b) => sharedTopics(b) - sharedTopics(a))
    return { topic, guides: ranked.slice(0, RELATED_COUNT) }
  }
  return null
}
