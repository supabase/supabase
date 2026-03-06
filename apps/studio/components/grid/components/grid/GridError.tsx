import { useParams } from 'common'
import { useTableFilter } from 'components/grid/hooks/useTableFilter'
import { useTableFilterNew } from 'components/grid/hooks/useTableFilterNew'
import { useTableSort } from 'components/grid/hooks/useTableSort'
import AlertError from 'components/ui/AlertError'
import { InlineLink } from 'components/ui/InlineLink'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useCallback } from 'react'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

import { isFilterRelatedError } from './GridError.utils'
import { useIsTableFilterBarEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { HighCostError } from '@/components/ui/HighQueryCost'
import { COST_THRESHOLD_ERROR } from '@/data/sql/execute-sql-query'
import { useTableEditorStateSnapshot } from '@/state/table-editor'
import { ResponseError } from '@/types'

export const GridError = ({ error }: { error?: ResponseError | null }) => {
  const { id: _id } = useParams()
  const tableId = _id ? Number(_id) : undefined

  const newFilterBarEnabled = useIsTableFilterBarEnabled()
  const { filters: oldFilters, clearFilters: clearOldFilters } = useTableFilter()
  const { filters: newFilters, clearFilters: clearNewFilters } = useTableFilterNew()
  const { sorts } = useTableSort()

  const snap = useTableEditorTableStateSnapshot()
  const tableEditorSnap = useTableEditorStateSnapshot()

  const removeAllFilters = useCallback(() => {
    if (newFilterBarEnabled) {
      clearNewFilters()
    } else {
      clearOldFilters()
    }
  }, [clearOldFilters, clearNewFilters, newFilterBarEnabled])

  if (!error) return null

  const tableEntityType = snap.originalTable?.entity_type
  const isForeignTable = tableEntityType === ENTITY_TYPE.FOREIGN_TABLE

  const isForeignTableMissingVaultKeyError =
    isForeignTable && error?.message?.includes('query vault failed')

  const hasActiveFilters = oldFilters.length > 0 || newFilters.length > 0

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
        onSelectLoadData={() => {
          if (!!tableId) tableEditorSnap.setTableToIgnorePreflightCheck(tableId)
        }}
      />
    )
  } else if (isForeignTableMissingVaultKeyError) {
    return <ForeignTableMissingVaultKeyError />
  } else if (hasFilterRelatedError) {
    return <FilterError removeAllFilters={removeAllFilters} />
  } else if (isInvalidOrderingOperatorError) {
    return <InvalidOrderingOperatorError error={error} />
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
      <p className="!mb-4">
        One or more of your filters may have a value or operator that doesn't match the column's
        data type. Try updating or removing the filter.
      </p>
      <Button type="default" onClick={removeAllFilters}>
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
      title={`Sorting is not supporting on ${sorts.length > 1 ? 'one of the selected columns' : 'the selected column'}`}
    >
      <p className="!mb-0">
        Unable to retrieve results as sorting is not supported on{' '}
        {sorts.length > 1 ? 'one of the selected columns' : 'the selected column'} due to its data
        type. ({formattedInvalidDataType})
      </p>
      <p className="!mb-2">
        Remove any sorts on columns with the data type {formattedInvalidDataType} applying the sorts
        again.
      </p>
      <p className="text-sm text-foreground-lighter prose max-w-full !mb-4">
        Error: <code className="text-code-inline">{error.message}</code>
      </p>

      <Button type="default" onClick={() => onApplySorts([])}>
        Remove sorts
      </Button>
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
