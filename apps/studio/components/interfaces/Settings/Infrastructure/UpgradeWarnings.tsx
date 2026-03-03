import Link from 'next/link'

import { ProjectUpgradeEligibilityValidationError } from '@/data/config/project-upgrade-eligibility-query'
import { useFlag, useParams } from 'common'
import { InlineLink } from 'components/ui/InlineLink'
import { DOCS_URL } from 'lib/constants'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

export const ReadReplicasWarning = ({ latestPgVersion }: { latestPgVersion: string }) => {
  const { ref } = useParams()
  const unifiedReplication = useFlag('unifiedReplication')

  return (
    <Admonition
      type="note"
      showIcon={false}
      title="A newer version of Postgres is available"
      description={`You will need to remove all read replicas prior to upgrading your Postgres version to the latest available (${latestPgVersion}).`}
      actions={
        unifiedReplication ? (
          <Button asChild type="default">
            <Link href={`/project/${ref}/database/replication`}>Manage read replicas</Link>
          </Button>
        ) : undefined
      }
    />
  )
}

const getValidationErrorTitle = (error: ProjectUpgradeEligibilityValidationError): string => {
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

const getValidationErrorDescription = (error: ProjectUpgradeEligibilityValidationError): string => {
  switch (error.type) {
    case 'objects_depending_on_pg_cron':
      return 'Remove objects that depend on pg_cron'
    case 'indexes_referencing_ll_to_earth':
      return `Drop or recreate the index on table ${error.schema_name}.${error.table_name} that references ll_to_earth()`
    case 'function_using_obsolete_lang':
      return `Update the function to use a supported language instead of ${error.lang_name}`
    case 'unsupported_extension':
      return 'Remove the unsupported extension'
    case 'unsupported_fdw_handler':
      return `Update or remove the FDW using the obsolete handler ${error.fdw_handler_name}`
    case 'unlogged_table_with_persistent_sequence':
      return `Convert the sequence ${error.sequence_name} to unlogged or convert the table to logged`
    case 'user_defined_objects_in_internal_schemas':
      return `Move the ${error.obj_type} to your own schema`
    case 'active_replication_slot':
      return 'Drop the active replication slot'
  }
}

const ValidationErrorItem = ({ error }: { error: ProjectUpgradeEligibilityValidationError }) => {
  const { ref: projectRef } = useParams()
  const title = getValidationErrorTitle(error)
  const description = getValidationErrorDescription(error)

  const getManageLink = (): string | null => {
    const encode = encodeURIComponent
    switch (error.type) {
      case 'function_using_obsolete_lang':
        return `/project/${projectRef}/database/functions?schema=${encode(error.schema_name)}&search=${encode(error.function_name)}`
      case 'unsupported_extension':
        return `/project/${projectRef}/database/extensions?filter=${encode(error.extension_name)}`
      case 'indexes_referencing_ll_to_earth':
        return `/project/${projectRef}/database/indexes?schema=${encode(error.schema_name)}&search=${encode(error.index_name)}`
      case 'unlogged_table_with_persistent_sequence':
        return `/project/${projectRef}/database/tables?schema=${encode(error.schema_name)}&search=${encode(error.table_name)}`
      case 'user_defined_objects_in_internal_schemas':
        if (error.obj_type === 'function') {
          return `/project/${projectRef}/database/functions?schema=${encode(error.schema_name)}&search=${encode(error.obj_name)}`
        }
        if (error.obj_type === 'table') {
          return `/project/${projectRef}/database/tables?schema=${encode(error.schema_name)}&search=${encode(error.obj_name)}`
        }
        return null
      case 'active_replication_slot':
        return null
      case 'unsupported_fdw_handler':
        return `/project/${projectRef}/integrations`
      case 'objects_depending_on_pg_cron':
        return null
      default:
        return null
    }
  }

  const manageLink = getManageLink()

  return (
    <li className="py-3 last:pb-0 flex flex-row gap-x-3 justify-between items-center">
      <div className="flex flex-col gap-y-0.5 flex-1 min-w-0">
        <h6 className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0 text-sm font-normal text-foreground">
          {title}
        </h6>
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
  validationErrors: ProjectUpgradeEligibilityValidationError[]
}) => {
  return (
    <Admonition type="note" showIcon={false} title="A newer version of Postgres is available">
      <div className="flex flex-col gap-3">
        <p>
          The following issues must be resolved before upgrading.{' '}
          <InlineLink href={`${DOCS_URL}/guides/platform/upgrading`}>Learn more</InlineLink>
        </p>
        <ul className="border-t border-border-muted flex flex-col divide-y divide-border-muted">
          {validationErrors.map((error, idx) => (
            <ValidationErrorItem key={`${error.type}-${idx}`} error={error} />
          ))}
        </ul>
      </div>
    </Admonition>
  )
}
