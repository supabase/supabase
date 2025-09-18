import { OPT_IN_TAGS } from 'lib/constants'
import { z } from 'zod'

export const aiOptInLevelSchema = z.enum([
  'disabled',
  'schema',
  'schema_and_log',
  'schema_and_log_and_data',
])

export type AiOptInLevel = z.infer<typeof aiOptInLevelSchema>

export const getAiOptInLevel = (tags: string[] | undefined): AiOptInLevel => {
  const hasSql = tags?.includes(OPT_IN_TAGS.AI_SQL)
  const hasData = tags?.includes(OPT_IN_TAGS.AI_DATA)
  const hasLog = tags?.includes(OPT_IN_TAGS.AI_LOG)

  if (hasData) {
    return 'schema_and_log_and_data'
  } else if (hasLog) {
    return 'schema_and_log'
  } else if (hasSql) {
    return 'schema'
  } else {
    return 'disabled'
  }
}
