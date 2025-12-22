import Link from 'next/link'

import { useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import type { ValidationError } from 'data/config/types'
import { DOCS_URL } from 'lib/constants'
import { Badge, Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

export const ReadReplicasWarning = ({ latestPgVersion }: { latestPgVersion: string }) => {
  return (
    <Admonition
      type="note"
      showIcon={false}
      title="A newer version of Postgres is available"
      description={`You will need to remove all read replicas prior to upgrading your Postgres version to the latest available (${latestPgVersion}).`}
    />
  )
}

const getValidationErrorKey = (error: ValidationError): string => {
  switch (error.type) {
    case 'objects_depending_on_pg_cron':
      return `pg_cron-${error.dependents.join(',')}`
    case 'indexes_referencing_ll_to_earth':
      return `index-${error.schema_name}.${error.index_name}`
    case 'function_using_obsolete_lang':
      return `function-${error.schema_name}.${error.function_name}`
    case 'unsupported_extension':
      return `extension-${error.extension_name}`
    case 'unsupported_fdw_handler':
      return `fdw-${error.fdw_name}`
    case 'unlogged_table_with_persistent_sequence':
      return `sequence-${error.schema_name}.${error.table_name}.${error.sequence_name}`
    case 'user_defined_objects_in_internal_schemas':
      return `internal-${error.schema_name}.${error.obj_name}`
    case 'active_replication_slot':
      return `slot-${error.slot_name}`
  }
}

const getValidationErrorTitle = (error: ValidationError): string => {
  switch (error.type) {
    case 'objects_depending_on_pg_cron':
      return error.dependents.join(', ')
    case 'indexes_referencing_ll_to_earth':
      return `${error.schema_name}.${error.index_name}`
    case 'function_using_obsolete_lang':
      return `${error.schema_name}.${error.function_name}`
    case 'unsupported_extension':
      return error.extension_name
    case 'unsupported_fdw_handler':
      return error.fdw_name
    case 'unlogged_table_with_persistent_sequence':
      return `${error.schema_name}.${error.table_name}`
    case 'user_defined_objects_in_internal_schemas':
      return `${error.schema_name}.${error.obj_name}`
    case 'active_replication_slot':
      return error.slot_name
  }
}

const getValidationErrorDescription = (error: ValidationError): string => {
  switch (error.type) {
    case 'objects_depending_on_pg_cron':
      return 'Objects depending on pg_cron must be removed'
    case 'indexes_referencing_ll_to_earth':
      return `Index on table ${error.schema_name}.${error.table_name} references ll_to_earth()`
    case 'function_using_obsolete_lang':
      return `Function uses obsolete language: ${error.lang_name}`
    case 'unsupported_extension':
      return 'Extension not supported in newer Postgres versions'
    case 'unsupported_fdw_handler':
      return `FDW using obsolete handler: ${error.fdw_handler_name}`
    case 'unlogged_table_with_persistent_sequence':
      return `Unlogged table has persistent sequence: ${error.sequence_name}`
    case 'user_defined_objects_in_internal_schemas':
      return `User-defined ${error.obj_type} in Supabase-managed schema`
    case 'active_replication_slot':
      return 'Active replication slot must be dropped'
  }
}

const ValidationErrorItem = ({
  error,
  projectRef,
}: {
  error: ValidationError
  projectRef: string
}) => {
  const title = getValidationErrorTitle(error)
  const description = getValidationErrorDescription(error)

  const getManageLink = (): string | null => {
    switch (error.type) {
      case 'function_using_obsolete_lang':
        return `/project/${projectRef}/database/functions?schema=${error.schema_name}&search=${error.function_name}`
      case 'unsupported_extension':
        return `/project/${projectRef}/database/extensions?filter=${error.extension_name}`
      case 'indexes_referencing_ll_to_earth':
      case 'unlogged_table_with_persistent_sequence':
        return `/project/${projectRef}/editor?schema=${error.schema_name}`
      case 'user_defined_objects_in_internal_schemas':
        return error.obj_type === 'function'
          ? `/project/${projectRef}/database/functions?schema=${error.schema_name}&search=${error.obj_name}`
          : `/project/${projectRef}/editor?schema=${error.schema_name}`
      case 'objects_depending_on_pg_cron':
      case 'unsupported_fdw_handler':
      case 'active_replication_slot':
        return null
    }
  }

  const manageLink = getManageLink()
  const showDeprecatedBadge = error.type === 'unsupported_extension'

  return (
    <li className="py-3 last:pb-0 flex flex-row justify-between items-center">
      <div className="flex flex-col gap-0 flex-1 min-w-0">
        <div className="flex flex-row gap-2 items-center">
          <h6 className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0 text-sm font-normal text-foreground">
            {title}
          </h6>
          {showDeprecatedBadge && (
            <Badge variant="warning" className="flex-shrink-0">
              Deprecated
            </Badge>
          )}
        </div>
        <p className="text-foreground-lighter text-xs">{description}</p>
      </div>
      {manageLink && (
        <Button size="tiny" type="default" asChild>
          <Link href={manageLink}>Manage</Link>
        </Button>
      )}
    </li>
  )
}

export const ValidationErrorsWarning = ({
  validationErrors,
}: {
  validationErrors: ValidationError[]
}) => {
  const { ref } = useParams()
  if (!ref) return null
  const projectRef: string = ref
  return (
    <Admonition type="note" showIcon={false} title="A newer version of Postgres is available">
      <div className="flex flex-col gap-3">
        <p>
          The following issues must be resolved before upgrading.{' '}
          <InlineLink href={`${DOCS_URL}/guides/platform/upgrading`}>Learn more</InlineLink>
        </p>
        <ul className="border-t border-border-muted flex flex-col divide-y divide-border-muted">
          {validationErrors.map((error) => (
            <ValidationErrorItem
              key={getValidationErrorKey(error)}
              error={error}
              projectRef={projectRef}
            />
          ))}
        </ul>
      </div>
    </Admonition>
  )
}
