import { noop } from 'lodash'
import { Badge, IconCode, IconDatabase } from 'ui'

import Description from 'components/interfaces/Docs/Description'

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
    <>
      <div className="mb-4 flex items-center justify-between ">
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2">
            <label className="font-mono text-xs uppercase text-scale-900  min-w-[55px]">
              Column
            </label>

            <div className="flex items-center gap-4">
              <span className="text-md text-scale-1200 pb-0.5">{name}</span>
            </div>
          </div>
        </div>

        <Badge color={required ? 'amber' : 'scale'}>{required ? 'Required' : 'Optional'}</Badge>
      </div>
      {format && (
        <div className="grid gap-2 mt-6">
          <div className="mb-4 flex items-center gap-2">
            <label className="font-mono text-xs uppercase text-scale-900 min-w-[55px]">Type</label>
            <div>
              <span className="flex grow-0 bg-slate-300 px-2 py-0.5 rounded-md text-scale-1000">
                <span className="flex items-center gap-2 text-sm">
                  <IconCode size="tiny" />
                  <span>{getColumnType(type, format)}</span>
                </span>
              </span>
            </div>
          </div>
          <div className="mb-4 flex items-center gap-2">
            <label className="font-mono text-xs uppercase text-scale-900 min-w-[55px]">
              Format
            </label>
            <div>
              <span className="flex grow-0 bg-slate-300 px-2 py-0.5 rounded-md text-scale-1000">
                <span className="flex items-center gap-2 text-sm">
                  <IconDatabase size="tiny" />
                  <span>{format}</span>
                </span>
              </span>
            </div>
          </div>
        </div>
      )}
      {description !== false && (
        <div className="grid gap-2 mt-2">
          <label className="font-mono text-xs uppercase text-scale-900">Description</label>
          <Description
            content={description?.toString()}
            metadata={metadata}
            onChange={onDesciptionUpdated}
          />
        </div>
      )}
    </>
  )
}
export default Param
