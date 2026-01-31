import { useParams } from 'common'
import { useTableFilter } from 'components/grid/hooks/useTableFilter'
import { useTableSort } from 'components/grid/hooks/useTableSort'
import AlertError from 'components/ui/AlertError'
import { InlineLink } from 'components/ui/InlineLink'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

import { HighCostError } from '@/components/ui/HighQueryCost'
import { COST_THRESHOLD_ERROR } from '@/data/sql/execute-sql-query'
import { ResponseError } from '@/types'

export const GridError = ({ error }: { error?: ResponseError | null }) => {
  const { filters } = useTableFilter()
  const { sorts } = useTableSort()
  const snap = useTableEditorTableStateSnapshot()

  if (!error) return null

  const tableEntityType = snap.originalTable?.entity_type
  const isForeignTable = tableEntityType === ENTITY_TYPE.FOREIGN_TABLE

  const isForeignTableMissingVaultKeyError =
    isForeignTable && error?.message?.includes('query vault failed')

  const isInvalidSyntaxError =
    filters.length > 0 && error?.message?.includes('invalid input syntax')

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
      />
    )
  } else if (isForeignTableMissingVaultKeyError) {
    return <ForeignTableMissingVaultKeyError />
  } else if (isInvalidSyntaxError) {
    return <InvalidSyntaxError error={error} />
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

const InvalidSyntaxError = ({ error }: { error: ResponseError }) => {
  const { onApplyFilters } = useTableFilter()

  return (
    <Admonition
      type="warning"
      className="pointer-events-auto"
      title="Invalid input syntax provided in filter value(s)"
    >
      <p className="!mb-0">
        Unable to retrieve results as the provided value in your filter(s) doesn't match it's column
        data type.
      </p>
      <p className="!mb-2">
        Verify that your filter values are correct before applying the filters again.
      </p>
      <p className="text-sm text-foreground-lighter prose max-w-full !mb-4">
        Error: <code className="text-code-inline">{error.message}</code>
      </p>

      <Button type="default" onClick={() => onApplyFilters([])}>
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
