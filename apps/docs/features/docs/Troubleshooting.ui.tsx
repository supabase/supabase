import { getAllTroubleshootingEntries } from './Troubleshooting.utils'
import { MDXRemoteBase } from './MdxBase'
import { ErrorBoundary } from 'react-error-boundary'
import { TROUBLESHOOTING_ENTRY_ID } from './Troubleshooting.ui.client'

export function TroubleshootingPreview({
  entry,
}: {
  entry: Awaited<ReturnType<typeof getAllTroubleshootingEntries>>[number]
}) {
  return (
    <article
      id={TROUBLESHOOTING_ENTRY_ID}
      className="prose border rounded-lg"
      style={{ '--local-padding': '1rem' } as React.CSSProperties}
      aria-labelledby={`troubleshooting-entry-title-${entry.data.database_id}`}
      data-keywords={[...entry.data.topics, ...(entry.data.keywords ?? [])].join(',')}
    >
      <h2
        id={`troubleshooting-entry-title-${entry.data.database_id}`}
        className="m-0 p-[var(--local-padding)]"
      >
        {entry.data.title}
      </h2>
      <hr className="m-0" />
      <ErrorBoundary fallback={null}>
        <h3 className="m-0 p-[var(--local-padding)] pb-1 text-sm text-foreground-lighter italic">
          Preview
        </h3>
        <div className="p-[var(--local-padding)] pt-0">
          <div className="rounded-lg border px-4 bg-gray-200 opacity-80">
            <MDXRemoteBase source={entry.content.slice(0, 150)} />
          </div>
        </div>
      </ErrorBoundary>
    </article>
  )
}
