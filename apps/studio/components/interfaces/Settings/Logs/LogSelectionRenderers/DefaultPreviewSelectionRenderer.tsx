import { cn, CodeBlock } from 'ui'
import type { PreviewLogData } from '../Logs.types'
import { SelectionDetailedTimestampRow } from '../LogsFormatters'

const DefaultPreviewSelectionRenderer = ({ log }: { log: PreviewLogData }) => (
  <div className={`space-y-6 py-4 px-5`}>
    {log?.timestamp && <SelectionDetailedTimestampRow value={log.timestamp} />}
    <div className="flex flex-col gap-3">
      <h3 className="text-foreground-lighter text-sm">Event Message</h3>
      {log?.event_message && (
        <CodeBlock
          className="prose dark:prose-dark max-w-full"
          hideLineNumbers
          value={JSON.stringify(log?.event_message)}
        />
      )}
    </div>
    <div className="flex flex-col gap-3">
      <h3 className="text-foreground-lighter text-sm">Metadata</h3>
      <CodeBlock
        hideLineNumbers
        value={JSON.stringify(log?.metadata, null, 2) || ''}
        language="json"
        className={cn(
          'max-w-full',
          '!py-3 !px-3.5 prose dark:prose-dark transition',
          '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap'
        )}
      />
    </div>
  </div>
)

export default DefaultPreviewSelectionRenderer
