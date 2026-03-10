import { noop } from 'lodash'
import { Badge } from 'ui'

import Description from '@/components/interfaces/Docs/Description'

function getColumnType(type: string, format: string) {
  // json and jsonb both have type=undefined, so check format instead
  if (type === undefined && (format === 'jsonb' || format === 'json')) return 'json'

  switch (type) {
    case 'string':
      return 'string'
    case 'integer':
      return 'number'
    case 'json':
      return 'json'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    default:
      return ''
  }
}

interface ParamProps {
  name: string
  type: string
  format: string
  required: boolean
  description: boolean
  metadata?: any
  onDesciptionUpdated?: () => void
}
const Param = ({
  name,
  type,
  format,
  required,
  description,
  metadata = {},
  onDesciptionUpdated = noop,
}: ParamProps) => {
  return (
    <div className="not-prose">
      <div className="mb-4 flex items-center gap-4">
        <h3 className="heading-default text-foreground mb-0 mt-0">{name}</h3>

        <Badge variant={required ? 'warning' : 'default'}>
          {required ? 'Required' : 'Optional'}
        </Badge>
      </div>
      {format && (
        <div className="grid grid-cols-[auto_1fr] gap-y-2 gap-x-10 text-sm">
          <label className="text-foreground-lighter">Type</label>
          <div className="text-foreground">{getColumnType(type, format)}</div>
          <label className="text-foreground-lighter">Format</label>
          <div className="text-foreground">{format}</div>
          {description !== false && (
            <>
              <label className="text-foreground-lighter">Description</label>
              <div className="text-foreground pt-1">
                <Description
                  content={description?.toString()}
                  metadata={metadata}
                  onChange={onDesciptionUpdated}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
export default Param
