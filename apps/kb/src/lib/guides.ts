import { defaultFilter } from 'cmdk'

import { TOPICS, topicToSlug, type Topic } from './topics'

export interface GuideSummary {
  id: string
  title: string
  description: string
  topics: Topic[]
  href: string
}

export interface FeaturedGuide extends GuideSummary {
  slot: string
  actionLabel?: string
}

interface FilterGuidesParams {
  guides: GuideSummary[]
  topic: Topic | null
  query: string
}

interface PadFeaturedParams {
  featured: Omit<FeaturedGuide, 'slot'>[]
  fallback: Omit<FeaturedGuide, 'slot'>[]
  count?: number
}

interface EmptyStateParams {
  topic: Topic | null
  query: string
}

export interface EmptyState {
  message: string
  action: string
  isSearch: boolean
}

const FEATURED_COUNT = 3

export const filterGuides = ({ guides, topic, query }: FilterGuidesParams): GuideSummary[] => {
  const inTopic = topic ? guides.filter((guide) => guide.topics.includes(topic)) : guides
  const search = query.trim()
  if (!search) return inTopic

  return inTopic
    .map((guide, index) => ({ guide, index, score: defaultFilter(guide.title, search) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ guide }) => guide)
}

export const padFeatured = ({
  featured,
  fallback,
  count = FEATURED_COUNT,
}: PadFeaturedParams): FeaturedGuide[] => {
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

export const emptyStateFor = ({ topic, query }: EmptyStateParams): EmptyState => {
  const search = query.trim()
  if (search) {
    const inTopic = topic ? ` in ${topic}` : ''
    return {
      message: `No guide titles match “${search}”${inTopic}.`,
      action: 'Clear search',
      isSearch: true,
    }
  }
  const topicLabel = topic ? `${topic} ` : ''
  return {
    message: `There are no ${topicLabel}guides yet.`,
    action: 'Show all guides',
    isSearch: false,
  }
}
