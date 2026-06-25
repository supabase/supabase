import { SupportCategories } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { SupportLink } from '@/components/interfaces/Support/SupportLink'
import AlertError from '@/components/ui/AlertError'
import { InlineLink } from '@/components/ui/InlineLink'
import { useJitDbAccessQuery } from '@/data/jit-db-access/jit-db-access-query'

type JitUnavailableReason =
  | 'manual_migration_required'
  | 'postgres_upgrade_required'
  | 'temporarily_unavailable'
  | undefined

function getUnavailableTitle(unavailableReason: JitUnavailableReason) {
  if (unavailableReason === 'postgres_upgrade_required') return 'Postgres upgrade required'
  if (unavailableReason === 'manual_migration_required') return 'Migration required'
  return 'Temporary access unavailable'
}

function getUnavailableDescription({
  unavailableReason,
  projectRef,
}: {
  unavailableReason: JitUnavailableReason
  projectRef: string
}) {
  const projectReference = (
    <>
      Project <code className="text-code-inline">{projectRef}</code>
    </>
  )

  if (unavailableReason === 'postgres_upgrade_required') {
    return (
      <>
        {projectReference} must be upgraded to Postgres 17 or later before temporary access can be
        enabled.
      </>
    )
  }

  if (unavailableReason === 'manual_migration_required') {
    return (
      <>
        {projectReference} must be migrated before temporary access can be enabled. Contact support
        to migrate this project.
      </>
    )
  }

  if (unavailableReason === 'temporarily_unavailable') {
    return 'This feature is currently unavailable for this project. Contact support if you need help enabling it.'
  }

  return 'This feature is currently unavailable for this project. Contact support if you need help enabling it.'
}

type TemporaryAccessProjectNoticeProps = {
  projectRef?: string
  parentProjectRef?: string | null
}

export function TemporaryAccessProjectNotice({
  projectRef,
  parentProjectRef,
}: TemporaryAccessProjectNoticeProps) {
  const configurationProjectRef = parentProjectRef ?? projectRef

  const {
    data: jitDbAccessConfiguration,
    error: jitDbAccessConfigurationError,
    isError: isErrorJitDbAccessConfiguration,
    isLoading: isLoadingConfiguration,
  } = useJitDbAccessQuery(
    { projectRef: configurationProjectRef },
    { enabled: !!configurationProjectRef && !parentProjectRef }
  )

  if (!projectRef) return null

  if (parentProjectRef) {
    return (
      <Admonition
        type="note"
        title="Managed in the main branch"
        description={
          <>
            Temporary access is configured from the main branch. Return to the{' '}
            <InlineLink href={`/project/${parentProjectRef}/settings/database`}>
              main branch
            </InlineLink>{' '}
            to configure database access.
          </>
        }
      />
    )
  }

  if (isLoadingConfiguration) return null

  if (isErrorJitDbAccessConfiguration) {
    return (
      <AlertError
        projectRef={projectRef}
        subject="Failed to load temporary access"
        error={jitDbAccessConfigurationError as { message: string } | null}
        showInstructions={false}
      />
    )
  }

  if (jitDbAccessConfiguration?.state !== 'unavailable') return null

  const unavailableReason = jitDbAccessConfiguration.unavailableReason as JitUnavailableReason
  const unavailableTitle = getUnavailableTitle(unavailableReason)

  return (
    <Admonition
      type="warning"
      layout="responsive"
      title={unavailableTitle}
      description={getUnavailableDescription({ unavailableReason, projectRef })}
      actions={
        unavailableReason === 'postgres_upgrade_required' ? (
          <Button variant="default" asChild>
            <Link href={`/project/${projectRef}/settings/infrastructure`}>Upgrade Postgres</Link>
          </Button>
        ) : (
          <Button variant="default" asChild>
            <SupportLink
              queryParams={{
                category: SupportCategories.PROBLEM,
                projectRef,
                subject: unavailableTitle,
              }}
            >
              Contact support
            </SupportLink>
          </Button>
        )
      }
    />
  )
}
