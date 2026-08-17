import Link from 'next/link'
import { Fragment } from 'react'

import { TroubleshootingFilter } from './Troubleshooting.ui.client'
import {
  getArticleSlug,
  getTroubleshootingDiagnosticSourceLabel,
  type ITroubleshootingEntry,
  type ITroubleshootingMetadata,
} from './Troubleshooting.utils'
import {
  formatError,
  formatTroubleshootingGroupLabel,
  groupTroubleshootingEntries,
  TROUBLESHOOTING_CONTAINER_ID,
  TROUBLESHOOTING_DATA_ATTRIBUTES,
  type TroubleshootingGroupBy,
} from './Troubleshooting.utils.shared'

export function TroubleshootingPreview({ entry }: { entry: ITroubleshootingEntry }) {
  const keywords = [...entry.data.topics, ...(entry.data.keywords ?? [])]
  const articleSlug = getArticleSlug(entry)
  const articleUrl = `/guides/troubleshooting/${articleSlug}`
  const titleId = `troubleshooting-entry-title-${articleSlug}`
  const formattedErrors = Array.from(
    new Set(entry.data.errors?.map(formatError).filter(Boolean) ?? [])
  )
  const attributes = {
    [TROUBLESHOOTING_DATA_ATTRIBUTES.QUERY_ATTRIBUTE]:
      TROUBLESHOOTING_DATA_ATTRIBUTES.QUERY_VALUE_ENTRY,
    [TROUBLESHOOTING_DATA_ATTRIBUTES.PRODUCTS_LIST_ATTRIBUTE]: entry.data.topics.join(','),
    [TROUBLESHOOTING_DATA_ATTRIBUTES.KEYWORDS_LIST_ATTRIBUTE]: keywords.join(','),
    [TROUBLESHOOTING_DATA_ATTRIBUTES.ERRORS_LIST_ATTRIBUTE]: formattedErrors.join(','),
  }

  return (
    <Link
      href={articleUrl}
      className="relative border-b py-4 flex flex-col gap-y-3 @4xl/troubleshooting:grid @4xl/troubleshooting:gap-y-0 grid-cols-subgrid @4xl/troubleshooting:col-span-3 gap-x-4 no-underline text-foreground hover:bg-surface-100 focus-visible:bg-surface-100 transition-colors"
      role="row"
      aria-labelledby={titleId}
      {...attributes}
    >
      <div role="cell" className="flex flex-col gap-2">
        <h3 id={titleId} className="text-lg gap-x-4">
          <span className="sr-only">Symptom or error: </span>
          {entry.data.title}
        </h3>
        {formattedErrors.length > 0 && (
          <span className="text-xs text-foreground-lighter ml-1 @4xl/troubleshooting:ml-0">
            {formattedErrors.map((error, index) => (
              <Fragment key={error}>
                <code>{error}</code>
                {index < formattedErrors.length - 1 ? ', ' : ''}
              </Fragment>
            ))}
          </span>
        )}
      </div>
      <div role="cell" className="flex flex-wrap gap-1 items-start text-xs text-foreground-light">
        <span className="sr-only">Where to check: </span>
        {entry.data.diagnostic_sources.map((source) => (
          <span key={source} className="px-2 py-px border rounded-full inline-flex items-center">
            {getTroubleshootingDiagnosticSourceLabel(source)}
          </span>
        ))}
      </div>
      <p role="cell" className="text-sm text-foreground-light m-0">
        <span className="sr-only">Likely meaning: </span>
        {entry.data.summary}
      </p>
    </Link>
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
    <div className="lg:sticky lg:top-(--header-height) lg:z-10 bg-background">
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
  groupBy,
}: {
  name: string
  entries: Array<ITroubleshootingEntry>
  groupBy?: TroubleshootingGroupBy
}) {
  const headingId = 'matching-troubleshooting-entries'
  const groupedEntries = groupBy ? groupTroubleshootingEntries(entries, groupBy) : null

  return (
    <div id={TROUBLESHOOTING_CONTAINER_ID} className="@container/troubleshooting">
      <h2 id={headingId} className="sr-only">
        Matching troubleshooting entries
      </h2>
      {entries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-foreground-light text-lg">
            No troubleshooting guides available for {name} yet.
          </p>
        </div>
      ) : groupedEntries ? (
        <div className="flex flex-col">
          {groupedEntries.map(([group, groupEntries]) => {
            const headingIdForGroup = `${group}-entries`

            return (
              <section
                key={group}
                id={group}
                className="scroll-mt-24 mt-10 first:mt-0"
                {...{ [TROUBLESHOOTING_DATA_ATTRIBUTES.GROUP_ATTRIBUTE]: group }}
              >
                <h2 id={headingIdForGroup} className="text-xl tracking-tight mb-4">
                  {formatTroubleshootingGroupLabel(group)}
                </h2>
                <TroubleshootingEntryTable entries={groupEntries} labelledBy={headingIdForGroup} />
              </section>
            )
          })}
        </div>
      ) : (
        <TroubleshootingEntryTable entries={entries} labelledBy={headingId} />
      )}
    </div>
  )
}

function TroubleshootingEntryTable({
  entries,
  labelledBy,
}: {
  entries: Array<ITroubleshootingEntry>
  labelledBy: string
}) {
  return (
    <div role="table" aria-labelledby={labelledBy}>
      <div
        role="row"
        className="hidden @4xl/troubleshooting:grid grid-cols-[minmax(0,2fr)_minmax(10rem,1fr)_minmax(0,2fr)] gap-x-4 border-b pb-3 text-xs uppercase tracking-wide text-foreground-lighter"
      >
        <span role="columnheader">Symptom or error</span>
        <span role="columnheader">Where to check</span>
        <span role="columnheader">Likely meaning</span>
      </div>
      <ul
        role="rowgroup"
        className="grid @4xl/troubleshooting:grid-cols-[minmax(0,2fr)_minmax(10rem,1fr)_minmax(0,2fr)]"
      >
        {entries.map((entry) => (
          <li
            role="presentation"
            key={getArticleSlug(entry)}
            className="grid grid-cols-subgrid @4xl/troubleshooting:col-span-3"
          >
            <TroubleshootingPreview entry={entry} />
          </li>
        ))}
      </ul>
    </div>
  )
}
