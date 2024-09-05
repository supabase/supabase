import { getAllTroubleshootingEntries } from './Troubleshooting.utils'
import { MDXRemoteBase } from './MdxBase'
import { ErrorBoundary } from 'react-error-boundary'

export function TroubleshootingPreview({
  entry,
}: {
  entry: Awaited<ReturnType<typeof getAllTroubleshootingEntries>>[number]
}) {
  return (
    <article
      className="prose border rounded-lg"
      style={{ '--local-padding': '1rem' } as React.CSSProperties}
    >
      <h2 className="m-0 p-[var(--local-padding)]">{entry.data.title}</h2>
      <hr className="m-0" />
      <ErrorBoundary fallback={null}>
        <div className="p-[var(--local-padding)]">
          <div className="rounded-lg border px-4">
            <MDXRemoteBase source={entry.content.slice(0, 150)} />
          </div>
        </div>
      </ErrorBoundary>
    </article>
  )
}
