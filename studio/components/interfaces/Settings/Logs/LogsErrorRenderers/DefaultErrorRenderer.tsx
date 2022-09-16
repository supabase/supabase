import { Input } from '@supabase/ui'
import { LogQueryError } from '..'

export interface ErrorRendererProps {
  error: LogQueryError
  isCustomQuery: boolean
}

const DefaultErrorRenderer: React.FC<ErrorRendererProps> = ({ error }) => (
  <Input.TextArea
    size="tiny"
    value={typeof error === 'string' ? error : JSON.stringify(error, null, 2)}
    borderless
    className="font-mono w-full mt-4"
    copy
    rows={7}
  />
)
export default DefaultErrorRenderer
