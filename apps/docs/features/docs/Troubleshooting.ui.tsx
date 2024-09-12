import { ChevronRight, Wrench } from 'lucide-react'
import Link from 'next/link'
import { type PropsWithChildren, useCallback } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { MDXRemoteBase } from './MdxBase'
import { type ITroubleshootingEntry, getArticleSlug } from './Troubleshooting.utils'
import {
  TroubleshootingEntryAssociatedErrors,
  TroubleshootingFilter,
  TroubleshootingGlobalSearch,
} from './Troubleshooting.ui.client'
import {
  TROUBLESHOOTING_DATA_ATTRIBUTE,
  TROUBLESHOOTING_DATA_ATTRIBUTE_ENTRY,
  TROUBLESHOOTING_DATA_ATTRIBUTE_PREVIEW,
} from './Troubleshooting.utils.shared'

export function TroubleshootingPreview({
  entry,
  parentPage = '/guides/troubleshooting',
}: {
  entry: ITroubleshootingEntry
  parentPage?: string
}) {
  const keywords = [...entry.data.topics, ...(entry.data.keywords ?? [])]

  const articleAttributes = {
    [TROUBLESHOOTING_DATA_ATTRIBUTE]: TROUBLESHOOTING_DATA_ATTRIBUTE_ENTRY,
  }
  const previewAttributes = {
    [TROUBLESHOOTING_DATA_ATTRIBUTE]: TROUBLESHOOTING_DATA_ATTRIBUTE_PREVIEW,
  }

  return (
    <article
      className="prose max-w-none border rounded-lg"
      style={{ '--local-padding': '1rem' } as React.CSSProperties}
      aria-labelledby={`troubleshooting-entry-title-${entry.data.database_id}`}
      data-keywords={keywords.join(',')}
      {...articleAttributes}
    >
      <Link
        href={`/guides/troubleshooting/${getArticleSlug(entry.data)}?returnTo=${encodeURIComponent(parentPage)}`}
        className="group p-[var(--local-padding)] block no-underline w-full flex items-center justify-between gap-2"
      >
        <h2 id={`troubleshooting-entry-title-${entry.data.database_id}`} className="m-0 truncate">
          {entry.data.title}
        </h2>
        <ChevronRight className="text-foreground-lighter group-hover:translate-x-1 transition-transform" />
      </Link>
      <hr className="m-0" aria-hidden />
      <h3 className="sr-only">Keywords</h3>
      <ul className="not-prose p-[var(--local-padding)] flex flex-wrap items-center gap-2">
        {keywords
          .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
          .map((keyword) => (
            <li
              key={keyword}
              className="text-sm text-foreground-lighter rounded-md bg-foreground/[.026] px-2 py-0.5"
            >
              {keyword}
            </li>
          ))}
      </ul>
      {entry.data.errors && entry.data.errors.length > 0 && (
        <TroubleshootingEntryAssociatedErrors errors={entry.data.errors} />
      )}
      <ErrorBoundary fallback={null}>
        <h3 className="m-0 p-[var(--local-padding)] pb-1 text-sm text-foreground-lighter italic">
          Preview
        </h3>
        <div className="p-[var(--local-padding)] pt-0">
          <div
            className="rounded-lg border px-4 bg-foreground/[.026] opacity-70"
            {...previewAttributes}
          >
            <MDXRemoteBase source={`${entry.contentWithoutJsx.slice(0, 150)}...`} />
          </div>
          <span className="sr-only">End of preview</span>
        </div>
      </ErrorBoundary>
    </article>
  )
}

export function TroubleshootingSidebar({
  mode = 'filter',
  keywords,
}: {
  mode?: 'filter' | 'moreInfo'
  keywords: string[]
}) {
  const SharedScaffold = useCallback(
    ({ children }: PropsWithChildren) => (
      <div className="w-full flex flex-col gap-3">
        <h1>
          <Link
            className="flex items-center gap-3 my-3 text-brand-link"
            href="/guides/troubleshooting"
          >
            <Wrench size={16} />
            Troubleshooting
          </Link>
        </h1>
        <div className="flex flex-col gap-6">{children}</div>
      </div>
    ),
    []
  )

  if (mode === 'moreInfo') {
    return (
      <SharedScaffold>
        <TroubleshootingGlobalSearch />
        <h2 className="text-foreground-lighter">Related keywords</h2>
        <ul className="text-foreground-lighter">
          {keywords
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
            .map((keyword) => (
              <li key={keyword} className="list-['–'] ml-2 pl-2 leading-7">
                <Link
                  className="underline underline-offset-4 decoration-foreground-muted hover:text-foreground transition-colors"
                  href={`/guides/troubleshooting?keywords=${keyword}`}
                >
                  {keyword}
                </Link>
              </li>
            ))}
        </ul>
      </SharedScaffold>
    )
  }

  return (
    <SharedScaffold>
      <TroubleshootingFilter keywords={keywords} />
    </SharedScaffold>
  )
}
