import { cache } from 'react'
import { z } from 'zod'

import { cache_fullProcess_withDevCacheBust } from '~/features/helpers.fs'
import { IS_PLATFORM } from '~/lib/constants'
import { supabaseAdmin } from '~/lib/supabaseAdmin'
import {
  getAllTroubleshootingEntriesInternal,
  getArticleSlug as getArticleSlugInternal,
  TroubleshootingSchema,
  TROUBLESHOOTING_DIRECTORY,
} from './Troubleshooting.utils.common.mjs'
import { formatError } from './Troubleshooting.utils.shared'

// We don't have strictNullChecks on because we still have too many violations
// in the code base, so required types aren't typed properly by Zod.
export type ITroubleshootingMetadata = z.infer<typeof TroubleshootingSchema> &
  Pick<Required<z.infer<typeof TroubleshootingSchema>>, 'title' | 'topics' | 'database_id'>

export interface ITroubleshootingEntry {
  filePath: string
  content: string
  contentWithoutJsx: string
  data: ITroubleshootingMetadata
}

export const getArticleSlug = getArticleSlugInternal

async function getAllTroubleshootingEntriesTyped() {
  const result: ITroubleshootingEntry[] = (
    IS_PLATFORM ? await getAllTroubleshootingEntriesInternal() : []
  ) as ITroubleshootingEntry[]
  return result
}
export const getAllTroubleshootingEntries = cache_fullProcess_withDevCacheBust(
  getAllTroubleshootingEntriesTyped,
  TROUBLESHOOTING_DIRECTORY,
  () => JSON.stringify([])
)

export async function getAllTroubleshootingKeywords() {
  const entries = await getAllTroubleshootingEntries()
  const keywords = new Set<string>()
  for (const entry of entries) {
    for (const topic of entry.data.topics) {
      keywords.add(topic)
    }
    for (const keyword of entry.data.keywords ?? []) {
      keywords.add(keyword)
    }
  }
  return Array.from(keywords).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
}

export async function getAllTroubleshootingProducts() {
  const entries = await getAllTroubleshootingEntries()
  const products = new Set<string>()
  for (const entry of entries) {
    for (const topic of entry.data.topics) {
      products.add(topic)
    }
  }
  return Array.from(products).sort((a, b) => a.localeCompare(b))
}

export async function getAllTroubleshootingErrors() {
  const entries = await getAllTroubleshootingEntries()
  const allErrors = new Set(
    entries
      .flatMap((entry) => entry.data.errors ?? [])
      .filter((error) => error?.http_status_code || error?.code)
  )

  const seen = new Set<string>()
  for (const error of allErrors) {
    const key = formatError(error)
    if (seen.has(key)) {
      allErrors.delete(error)
    }
    seen.add(key)
  }

  function sortErrors(
    a: NonNullable<ITroubleshootingMetadata['errors']>[number],
    b: NonNullable<ITroubleshootingMetadata['errors']>[number]
  ) {
    return formatError(a).localeCompare(formatError(b))
  }

  return Array.from(allErrors).sort(sortErrors)
}

async function getTroubleshootingUpdatedDatesInternal() {
  if (!IS_PLATFORM) {
    return new Map<string, Date>()
  }

  const databaseIds = (await getAllTroubleshootingEntries())
    .map((entry) => entry.data.database_id)
    .filter((id) => !id.startsWith('pseudo-'))

  const { data, error } = await supabaseAdmin()
    .from('troubleshooting_entries')
    .select('id, date_updated')
    .in('id', databaseIds)
  if (error) {
    console.error(error)
  }

  return (data ?? []).reduce((acc, entry) => {
    acc.set(entry.id, new Date(entry.date_updated))
    return acc
  }, new Map<string, Date>())
}
export const getTroubleshootingUpdatedDates = cache(getTroubleshootingUpdatedDatesInternal)

async function getTroubleshootingEntriesByTopicImpl(
  topic: ITroubleshootingMetadata['topics'][number]
) {
  const allEntries = await getAllTroubleshootingEntries()
  return allEntries.filter((entry) => entry.data.topics.includes(topic))
}
export const getTroubleshootingEntriesByTopic = cache_fullProcess_withDevCacheBust(
  getTroubleshootingEntriesByTopicImpl,
  TROUBLESHOOTING_DIRECTORY,
  () => JSON.stringify([])
)

export async function getTroubleshootingKeywordsByTopic(
  topic: ITroubleshootingMetadata['topics'][number]
) {
  const entries = await getTroubleshootingEntriesByTopic(topic)
  const keywords = new Set<string>()
  for (const entry of entries) {
    for (const entryTopic of entry.data.topics) {
      keywords.add(entryTopic)
    }
    for (const keyword of entry.data.keywords ?? []) {
      keywords.add(keyword)
    }
  }
  return Array.from(keywords).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
}

export async function getTroubleshootingErrorsByTopic(
  topic: ITroubleshootingMetadata['topics'][number]
) {
  const entries = await getTroubleshootingEntriesByTopic(topic)
  const allErrors = new Set(
    entries
      .flatMap((entry) => entry.data.errors ?? [])
      .filter((error) => error?.http_status_code || error?.code)
  )

  const seen = new Set<string>()
  for (const error of allErrors) {
    const key = formatError(error)
    if (seen.has(key)) {
      allErrors.delete(error)
    }
    seen.add(key)
  }

  function sortErrors(
    a: NonNullable<ITroubleshootingMetadata['errors']>[number],
    b: NonNullable<ITroubleshootingMetadata['errors']>[number]
  ) {
    return formatError(a).localeCompare(formatError(b))
  }

  return Array.from(allErrors).sort(sortErrors)
}
