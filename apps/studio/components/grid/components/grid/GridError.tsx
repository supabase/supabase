import { useParams } from 'common'
import { useTableFilter } from 'components/grid/hooks/useTableFilter'
import AlertError from 'components/ui/AlertError'
import { InlineLink } from 'components/ui/InlineLink'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { Admonition } from 'ui-patterns'

export const GridError = ({ error }: { error?: any }) => {
  const { filters } = useTableFilter()
  const snap = useTableEditorTableStateSnapshot()

  const tableEntityType = snap.originalTable?.entity_type
  const isForeignTable = tableEntityType === ENTITY_TYPE.FOREIGN_TABLE

  const isForeignTableMissingVaultKeyError =
    isForeignTable && error?.message?.includes('query vault failed')

  const isInvalidSyntaxError =
    filters.length > 0 && error?.message?.includes('invalid input syntax')

  if (isForeignTableMissingVaultKeyError) {
    return <ForeignTableMissingVaultKeyError />
  } else if (isInvalidSyntaxError) {
    return <InvalidSyntaxError error={error} />
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

const InvalidSyntaxError = ({ error }: { error?: any }) => {
  return (
    <Admonition
      type="warning"
      className="pointer-events-auto"
      title="Invalid input syntax provided in filter value"
    >
      <p className="!mb-0">
        Unable to retrieve results as the provided value in your filter doesn't match it's column
        data type.
      </p>
      <p className="!mb-2">
        Verify that your filter values are correct before applying the filters again.
      </p>
      <p className="text-sm text-foreground-lighter prose max-w-full !mb-0">
        Error: <code className="text-xs">{error.message}</code>
      </p>
    </Admonition>
  )
}

const GeneralError = ({ error }: { error: any }) => {
  const { filters } = useTableFilter()

  return (
    <AlertError
      className="pointer-events-auto"
      error={error}
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
