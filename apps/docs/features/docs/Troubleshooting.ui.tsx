import { Wrench } from 'lucide-react'
import Link from 'next/link'
import { type PropsWithChildren, useCallback } from 'react'

import {
  type ITroubleshootingEntry,
  getArticleSlug,
  getTroubleshootingUpdatedDates,
} from './Troubleshooting.utils'
import { TroubleshootingFilter } from './Troubleshooting.ui.client'
import { formatError, TROUBLESHOOTING_DATA_ATTRIBUTES } from './Troubleshooting.utils.shared'
import { cn } from 'ui'

export async function TroubleshootingPreview({ entry }: { entry: ITroubleshootingEntry }) {
  const dateUpdated = entry.data.database_id.startsWith('pseudo-')
    ? new Date()
    : (await getTroubleshootingUpdatedDates()).get(entry.data.database_id)

  const keywords = [...entry.data.topics, ...(entry.data.keywords ?? [])]
  const attributes = {
    [TROUBLESHOOTING_DATA_ATTRIBUTES.QUERY_ATTRIBUTE]:
      TROUBLESHOOTING_DATA_ATTRIBUTES.QUERY_VALUE_ENTRY,
    [TROUBLESHOOTING_DATA_ATTRIBUTES.PRODUCTS_LIST_ATTRIBUTE]: entry.data.topics.join(','),
    [TROUBLESHOOTING_DATA_ATTRIBUTES.KEYWORDS_LIST_ATTRIBUTE]: keywords.join(','),
    [TROUBLESHOOTING_DATA_ATTRIBUTES.ERRORS_LIST_ATTRIBUTE]: entry.data.errors
      ?.map((error) => formatError(error))
      .join(','),
  }

  return (
    <div
      className="relative border-b py-4 flex flex-col gap-y-2 @4xl/troubleshooting:grid @4xl/troubleshooting:gap-y-0 grid-cols-subgrid @4xl/troubleshooting:col-span-3 gap-x-4"
      aria-labelledby={`troubleshooting-entry-title-${entry.data.database_id}`}
      {...attributes}
    >
      <div className="flex flex-col gap-2">
        <Link
          href={`/guides/troubleshooting/${getArticleSlug(entry)}`}
          className={cn(
            'visited:text-foreground-lighter',
            'before:absolute before:inset-0',
            'max-w-[90vw]'
          )}
        >
          <h3
            id={`troubleshooting-entry-title-${entry.data.database_id}`}
            className="text-lg @4xl/troubleshooting:truncate gap-x-4"
          >
            {entry.data.title}
          </h3>
        </Link>
        {entry.data.errors?.length > 0 && (
          <span className="text-xs text-foreground-lighter ml-1 @4xl/troubleshooting:ml-0">
            {entry.data.errors
              .map(formatError)
              .filter(Boolean)
              .map((error, index) => (
                <>
                  <code key={index}>{error}</code>
                  {index < entry.data.errors.length - 1 ? ', ' : ''}
                </>
              ))}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-0.5 items-start text-xs">
        {entry.data.topics.map((topic) => (
          <span key={topic} className="px-2 border rounded-full inline-flex items-center">
            {topic[0].toUpperCase() + topic.slice(1)}
          </span>
        ))}
      </div>
      <div className="text-sm text-foreground-lighter ml-2 @4xl/troubleshooting:ml-0">
        {dateUpdated &&
          (() => {
            const options = { month: 'short', day: 'numeric' } as Intl.DateTimeFormatOptions
            if (dateUpdated.getFullYear() !== new Date().getFullYear()) {
              options.year = 'numeric'
            }
            return dateUpdated.toLocaleDateString(undefined, options)
          })()}
      </div>
    </div>
  )
}
