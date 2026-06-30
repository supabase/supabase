import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { ChevronDown } from 'lucide-react'
import { useCallback } from 'react'
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { isFilterRelatedError } from './GridError.utils'
import { useTableFilter } from '@/components/grid/hooks/useTableFilter'
import { useTableSort } from '@/components/grid/hooks/useTableSort'
import { AlertError } from '@/components/ui/AlertError'
import { HighCostError } from '@/components/ui/HighQueryCost'
import { InlineLink } from '@/components/ui/InlineLink'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import { COST_THRESHOLD_ERROR } from '@/data/sql/execute-sql-mutation'
import { tableRowKeys } from '@/data/table-rows/keys'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTableEditorStateSnapshot } from '@/state/table-editor'
import { useTableEditorTableStateSnapshot } from '@/state/table-editor-table'
import { ResponseError } from '@/types'

export const GridError = ({ error }: { error?: ResponseError | null }) => {
  const { id: _id } = useParams()
  const tableId = _id ? Number(_id) : undefined

  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const { filters, clearFilters } = useTableFilter()
  const { sorts } = useTableSort()

  const snap = useTableEditorTableStateSnapshot()
  const tableEditorSnap = useTableEditorStateSnapshot()

  const removeAllFilters = useCallback(() => {
    clearFilters()
  }, [clearFilters])

  const handleLoadData = useCallback(() => {
    if (!!tableId) {
      tableEditorSnap.setTableToIgnorePreflightCheck(tableId)

      // Remove the cached error so useQuery re-fetches on the next render.
      queryClient.removeQueries({
        queryKey: tableRowKeys.tableRowsAndCount(project?.ref, tableId),
      })
    }
  }, [tableEditorSnap, tableId, queryClient, project?.ref])

  if (!error) return null

  const tableEntityType = snap.originalTable?.entity_type
  const isForeignTable = tableEntityType === ENTITY_TYPE.FOREIGN_TABLE

  const isForeignTableMissingVaultKeyError =
    isForeignTable && error?.message?.includes('query vault failed')

  const isIcebergUnauthorizedError =
    isForeignTable &&
    error?.message.includes('iceberg error') &&
    error?.message.includes('403 Forbidden') &&
    error?.message.includes('Invalid Compact JWS')

  const hasActiveFilters = filters.length > 0

  const hasFilterRelatedError = hasActiveFilters && isFilterRelatedError(error?.message)

  const isInvalidOrderingOperatorError =
    sorts.length > 0 && error?.message?.includes('identify an ordering operator')

  const isHighCostError = error?.message.includes(COST_THRESHOLD_ERROR)

  if (isHighCostError) {
    return (
      <HighCostError
        error={error}
        suggestions={[
          'Remove any sorts or filters on unindexed columns, or',
          'Create indexes for columns that you want to filter or sort on',
        ]}
        onSelectLoadData={handleLoadData}
      />
    )
  } else if (isForeignTableMissingVaultKeyError) {
    return <ForeignTableMissingVaultKeyError />
  } else if (hasFilterRelatedError) {
    return <FilterError removeAllFilters={removeAllFilters} />
  } else if (isInvalidOrderingOperatorError) {
    return <InvalidOrderingOperatorError error={error} />
  } else if (isIcebergUnauthorizedError) {
    return <IcebergUnauthorizedError error={error} />
  }

  return <GeneralError error={error} />
}

const ForeignTableMissingVaultKeyError = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const isBranch = project?.parent_project_ref !== undefined

  return (
    <Admonition
      type="warning"
      className="pointer-events-auto"
      title="Failed to retrieve rows from foreign table"
    >
      <p>
        The key that's used to retrieve data from your foreign table is either incorrect or missing.
        Verify the key in your{' '}
        <InlineLink href={`/project/${ref}/integrations?category=wrapper`}>
          wrapper's settings
        </InlineLink>{' '}
        or in <InlineLink href={`/project/${ref}/integrations/vault/overview`}>Vault</InlineLink>.
      </p>
      {isBranch && (
        <p>
          Note: Vault keys from the main project do not sync to branches. You may add them manually
          into <InlineLink href={`/project/${ref}/integrations/vault/overview`}>Vault</InlineLink>{' '}
          if you want to query foreign tables while on a branch.
        </p>
      )}
    </Admonition>
  )
}

const FilterError = ({ removeAllFilters }: { removeAllFilters: () => void }) => {
  return (
    <Admonition
      type="note"
      className="pointer-events-auto"
      title="No results found — check your filter values"
    >
      <p className="mb-4!">
        One or more of your filters may have a value or operator that doesn't match the column's
        data type. Try updating or removing the filter.
      </p>
      <Button variant="default" onClick={removeAllFilters}>
        Remove filters
      </Button>
    </Admonition>
  )
}

const InvalidOrderingOperatorError = ({ error }: { error: ResponseError }) => {
  const { sorts, onApplySorts } = useTableSort()
  const invalidDataType = (error.message ?? '').split('type ').pop() ?? ''
  const formattedInvalidDataType = invalidDataType.includes('json')
    ? invalidDataType.toUpperCase()
    : invalidDataType

  return (
    <Admonition
      type="warning"
      className="pointer-events-auto"
      title={`Sorting is not supported on ${sorts.length > 1 ? 'one of the selected columns' : 'the selected column'}`}
    >
      <p className="mb-0!">
        Unable to retrieve results as sorting is not supported on{' '}
        {sorts.length > 1 ? 'one of the selected columns' : 'the selected column'} due to its data
        type. ({formattedInvalidDataType})
      </p>
      <p className="mb-2!">
        Remove any sorts on columns with the data type {formattedInvalidDataType} applying the sorts
        again.
      </p>
      <p className="text-sm text-foreground-lighter prose max-w-full mb-4!">
        Error: <code className="text-code-inline">{error.message}</code>
      </p>

      <Button variant="default" onClick={() => onApplySorts([])}>
        Remove sorts
      </Button>
    </Admonition>
  )
}

const IcebergUnauthorizedError = ({ error }: { error: ResponseError }) => {
  const { ref } = useParams()

  return (
    <Admonition
      type="warning"
      className="pointer-events-auto"
      title="Failed to retrieve rows from Iceberg foreign table"
    >
      <p className="text-balance">
        The API key from your project that's used to retrieve data from your foreign table is either
        incorrect or missing. Verify the API key (token) in your{' '}
        <InlineLink href={`/project/${ref}/storage/analytics`}>Iceberg Bucket</InlineLink>.
        Alternatively, you can also verify the token value in your{' '}
        <InlineLink href={`/project/${ref}/integrations/iceberg_wrapper/wrappers`}>
          wrapper's settings
        </InlineLink>{' '}
        or in <InlineLink href={`/project/${ref}/integrations/vault/overview`}>Vault</InlineLink>.
      </p>
      <ExpandError error={error} />
    </Admonition>
  )
}

const GeneralError = ({ error }: { error: ResponseError }) => {
  const { filters } = useTableFilter()

  return (
    <AlertError
      error={error}
      className="pointer-events-auto"
      subject="Failed to retrieve rows from table"
    >
      {filters.length > 0 && (
        <p>
          Verify that the filter values are correct, as the error may stem from an incorrectly
          applied filter
        </p>
      )}
    </AlertError>
  )
}

const ExpandError = ({ error }: { error: ResponseError }) => {
  return (
    <Collapsible>
      <CollapsibleTrigger className="mt-2 group font-normal p-0 [&[data-state=open]>div>svg]:-rotate-180!">
        <div className="flex items-center gap-x-2 w-full cursor-pointer">
          <span className="font-mono uppercase tracking-tight">View error</span>
          <ChevronDown className="transition-transform" size={14} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1">
        <code className="text-code-inline">{error.message}</code>
      </CollapsibleContent>
    </Collapsible>
  )
}
