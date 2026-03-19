import Link from 'next/link'
import { Fragment } from 'react'

import { cn } from 'ui'
import { TroubleshootingFilter } from './Troubleshooting.ui.client'
import {
  type ITroubleshootingEntry,
  type ITroubleshootingMetadata,
  getArticleSlug,
  getTroubleshootingUpdatedDates,
} from './Troubleshooting.utils'
import {
  formatError,
  TROUBLESHOOTING_DATA_ATTRIBUTES,
  TROUBLESHOOTING_CONTAINER_ID,
} from './Troubleshooting.utils.shared'

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
        {entry.data.errors?.length && entry.data.errors.length > 0 && (
          <span className="text-xs text-foreground-lighter ml-1 @4xl/troubleshooting:ml-0">
            {(entry.data.errors || [])
              .map(formatError)
              .filter(Boolean)
              .map((error, index) => (
                <Fragment key={error}>
                  <code>{error}</code>
                  {index < (entry.data.errors?.length || 0) - 1 ? ', ' : ''}
                </Fragment>
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

export function TroubleshootingHeader({
  title,
  description,
  keywords,
  products,
  errors,
}: {
  title: string
  description: string
  keywords: Array<string>
  products?: Array<string>
  errors: ITroubleshootingMetadata['errors']
}) {
  return (
    <div className="lg:sticky lg:top-[var(--header-height)] lg:z-10 bg-background">
      <div className="pt-8 pb-6 px-5">
        <h1 className="text-4xl tracking-tight mb-7">{title}</h1>
        <p className="text-lg text-foreground-light">{description}</p>
        <hr className="my-7" aria-hidden />
        <TroubleshootingFilter
          keywords={keywords}
          products={products}
          errors={errors}
          className="mb-0"
        />
      </div>
    </div>
  )
}

export function TroubleshootingEntries({
  name,
  entries,
}: {
  name: string
  entries: Array<ITroubleshootingEntry>
}) {
  return (
    <div id={TROUBLESHOOTING_CONTAINER_ID} className="@container/troubleshooting">
      <h2 className="sr-only">Matching troubleshooting entries</h2>
      {entries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-foreground-light text-lg">
            No troubleshooting guides available for {name} yet.
          </p>
        </div>
      ) : (
        <ul className="grid @4xl/troubleshooting:grid-cols-[78%_15%_7%]">
          {entries.map((entry) => (
            <li
              key={entry.data.database_id}
              className="grid grid-cols-subgrid @4xl/troubleshooting:col-span-3"
            >
              <TroubleshootingPreview entry={entry} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
