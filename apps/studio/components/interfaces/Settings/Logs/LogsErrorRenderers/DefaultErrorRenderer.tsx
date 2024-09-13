import { CodeBlock, Input } from 'ui'
import type { LogQueryError } from '../Logs.types'
import { Label } from '@ui/components/shadcn/ui/label'

export interface ErrorRendererProps {
  error: LogQueryError
  isCustomQuery: boolean
}

const DefaultErrorRenderer: React.FC<ErrorRendererProps> = ({ error }) => (
  <div className="flex w-full flex-col gap-2 prose min-w-full">
    <Label>Error</Label>
    <CodeBlock
      language="json"
      hideLineNumbers
      value={typeof error === 'string' ? error : JSON.stringify(error, null, 2)}
      className="w-full font-mono"
    />
  </div>
)
export default DefaultErrorRenderer
