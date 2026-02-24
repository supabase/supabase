import { useMemo } from 'react'
import { Button, Card } from 'ui'

import { InfiniteListDefault } from '@/components/ui/InfiniteList'

type SchemaRowProps = {
  item: string
  style?: React.CSSProperties
  onRemoveSchema: (schema: string) => void
}

const SchemaRow = ({ item, style, onRemoveSchema }: SchemaRowProps) => {
  return (
    <div className="flex border-b [&:hover]:bg-surface-200 transition-colors" style={style}>
      <div className="p-4 align-middle flex-1">{item}</div>
      <div className="p-4 align-middle text-right">
        <Button type="default" size="tiny" onClick={() => onRemoveSchema(item)}>
          Remove
        </Button>
      </div>
    </div>
  )
}

const ExposedSchemasListEmptyState = () => (
  <div className="flex flex-col gap-1 items-center justify-center py-8 text-center">
    <h3 className="text-foreground">No exposed schemas</h3>
    <p className="text-xs max-w-xs text-foreground-lighter">
      Add schemas above to expose them via the API.
    </p>
  </div>
)

type ExposedSchemasListProps = {
  schemas: string[]
  onRemoveSchema: (schema: string) => void
}

export const ExposedSchemasList = ({ schemas, onRemoveSchema }: ExposedSchemasListProps) => {
  const itemProps = useMemo(() => ({ onRemoveSchema }), [onRemoveSchema])

  return (
    <Card>
      <div className="w-full text-sm">
        <div className="flex border-b bg-200">
          <div className="h-10 px-4 flex items-center flex-1 heading-meta whitespace-nowrap text-foreground-lighter">
            Schema Name
          </div>
          <div className="h-10 px-4 flex items-center text-right">
            <span className="sr-only">Actions</span>
          </div>
        </div>

        {schemas.length === 0 ? (
          <ExposedSchemasListEmptyState />
        ) : (
          <InfiniteListDefault
            className="max-h-48"
            items={schemas}
            ItemComponent={SchemaRow}
            itemProps={itemProps}
            LoaderComponent={() => null}
            getItemKey={(index) => schemas[index]}
            getItemSize={() => 59}
            hasNextPage={false}
            isLoadingNextPage={false}
            onLoadNextPage={() => {}}
          />
        )}
      </div>
    </Card>
  )
}
