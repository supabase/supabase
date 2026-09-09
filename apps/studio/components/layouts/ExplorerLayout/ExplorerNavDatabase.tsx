import { ChevronRight, Folder } from 'lucide-react'
import { useState } from 'react'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { ExplorerNavPanel, rowClassName } from './ExplorerLayout.constants'
import { AlertError } from '@/components/ui/AlertError'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { useSchemasFilteredForHighAvailability } from '@/hooks/misc/useHighAvailability'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { INTERNAL_SCHEMAS } from '@/hooks/useProtectedSchemas'

export const ExplorerNavDatabase = ({
  onBack,
  onSelectSchema,
}: {
  onBack: () => void
  onSelectSchema: (schema: string) => void
}) => {
  const { data: project } = useSelectedProjectQuery()
  const [search, setSearch] = useState('')
  const { data, isPending, isError, error, isSuccess } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const visibleSchemas = useSchemasFilteredForHighAvailability(data)
  const schemas = visibleSchemas
    .filter((schema) => !INTERNAL_SCHEMAS.includes(schema.name))
    .filter((schema) => schema.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <ExplorerNavPanel
      label="Database"
      onBack={onBack}
      search={search}
      setSearch={setSearch}
      searchPlaceholder="Search schemas"
    >
      <nav className="flex min-h-0 flex-col gap-px overflow-y-auto px-3 pb-3">
        {isPending && <GenericSkeletonLoader />}
        {isError && <AlertError error={error} subject="Failed to retrieve schemas" />}
        {isSuccess && schemas.length === 0 && (
          <p className="px-2 py-2 text-xs text-foreground-lighter">No schemas found</p>
        )}
        {isSuccess &&
          schemas.map((schema) => (
            <button
              key={schema.id}
              type="button"
              tabIndex={0}
              className={rowClassName(false)}
              onClick={() => onSelectSchema(schema.name)}
            >
              <Folder size={14} className="shrink-0" />
              <span className="flex-1 truncate text-left">{schema.name}</span>
              <ChevronRight size={14} className="shrink-0 text-foreground-muted" />
            </button>
          ))}
      </nav>
    </ExplorerNavPanel>
  )
}
