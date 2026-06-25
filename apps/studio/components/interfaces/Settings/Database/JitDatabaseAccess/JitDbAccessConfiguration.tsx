import { SupportCategories } from '@supabase/shared-types/out/constants'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Badge, Button } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns'
import { Admonition } from 'ui-patterns/admonition'

import { SupportLink } from '@/components/interfaces/Support/SupportLink'
import AlertError from '@/components/ui/AlertError'
import { DocsButton } from '@/components/ui/DocsButton'
import { FeaturePreviewBadge } from '@/components/ui/FeaturePreviewBadge'
import { InlineLink } from '@/components/ui/InlineLink'
import { useJitDbAccessQuery } from '@/data/jit-db-access/jit-db-access-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'

export const JitDbAccessConfiguration = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()

  const parentProjectRef = project?.parent_project_ref

  const {
    data: jitDbAccessConfiguration,
    error: jitDbAccessConfigurationError,
    isError: isErrorJitDbAccessConfiguration,
    isLoading: isLoadingConfiguration,
    isSuccess: isSuccessConfiguration,
  } = useJitDbAccessQuery({ projectRef: ref })

  const isEnabled =
    jitDbAccessConfiguration?.state === 'enabled' &&
    jitDbAccessConfiguration?.appliedSuccessfully !== false
  const isJitDbAccessUnavailable = jitDbAccessConfiguration?.state === 'unavailable'
  const unavailableReason = isJitDbAccessUnavailable
    ? jitDbAccessConfiguration.unavailableReason
    : undefined

  const teamSettingsHref = organization?.slug ? `/org/${organization.slug}/team` : undefined

  const projectReference = ref ? (
    <>
      This project <code className="text-code-inline">{ref}</code>
    </>
  ) : (
    'This project'
  )
  const unavailableTitle =
    unavailableReason === 'postgres_upgrade_required'
      ? 'Postgres upgrade required'
      : unavailableReason === 'manual_migration_required'
        ? 'Migration required'
        : 'Temporary access unavailable'
  const unavailableDescription =
    unavailableReason === 'postgres_upgrade_required'
      ? 'must be upgraded to Postgres 17 or later before temporary access can be enabled.'
      : unavailableReason === 'manual_migration_required'
        ? 'must be migrated before temporary access can be enabled. Contact support to migrate this project.'
        : 'This feature is currently unavailable for this project. Contact support if you need help enabling it.'

  return (
    <PageSection id="jit-db-access-configuration">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>
            <span className="flex items-center gap-x-4">
              Temporary access
              <FeaturePreviewBadge featureKey={LOCAL_STORAGE_KEYS.UI_PREVIEW_JIT_DB_ACCESS} />
            </span>
          </PageSectionTitle>
        </PageSectionSummary>
        <DocsButton href={`${DOCS_URL}/guides/platform/temporary-access`} />
      </PageSectionMeta>

      <PageSectionContent className="space-y-4">
        {parentProjectRef && (
          <Admonition
            type="note"
            title="Managed in the main branch"
            description={
              <>
                Temporary access is configured from the main branch. Return to the{' '}
                <InlineLink href={`/project/${parentProjectRef}/settings/database`}>
                  main branch
                </InlineLink>{' '}
                to view status.
              </>
            }
          />
        )}

        {!parentProjectRef && isErrorJitDbAccessConfiguration && (
          <AlertError
            projectRef={ref}
            subject="Failed to load temporary access"
            error={jitDbAccessConfigurationError as { message: string } | null}
            showInstructions={false}
          />
        )}

        {!parentProjectRef && !isErrorJitDbAccessConfiguration && isJitDbAccessUnavailable && (
          <Admonition
            type="note"
            layout="responsive"
            title={unavailableTitle}
            description={
              unavailableReason === 'temporarily_unavailable' ? (
                unavailableDescription
              ) : (
                <>
                  {projectReference} {unavailableDescription}
                </>
              )
            }
            actions={
              unavailableReason === 'postgres_upgrade_required' && ref ? (
                <Button variant="default" asChild>
                  <Link href={`/project/${ref}/settings/infrastructure`}>Upgrade Postgres</Link>
                </Button>
              ) : (
                <Button variant="default" asChild>
                  <SupportLink
                    queryParams={{
                      category: SupportCategories.PROBLEM,
                      projectRef: ref,
                      subject: unavailableTitle,
                    }}
                  >
                    Contact support
                  </SupportLink>
                </Button>
              )
            }
          />
        )}

        {!parentProjectRef && !isErrorJitDbAccessConfiguration && !isJitDbAccessUnavailable && (
          <>
            <Admonition
              type="default"
              title="Manage access from Team settings"
              description={
                <>
                  Temporary database access is managed from{' '}
                  {teamSettingsHref ? (
                    <InlineLink href={teamSettingsHref}>Team settings</InlineLink>
                  ) : (
                    'Team settings'
                  )}
                  . Grant or revoke Postgres access for members when inviting collaborators or from
                  a member&apos;s actions menu.
                </>
              }
            />

            <div className="flex items-center gap-3 rounded-md border px-4 py-3">
              <span className="text-sm text-foreground-light">PAM status on this project</span>
              {isLoadingConfiguration ? (
                <Loader2 className="animate-spin text-foreground-muted" size={16} />
              ) : (
                <Badge variant={isEnabled ? 'success' : 'secondary'}>
                  {isEnabled ? 'Enabled' : 'Not enabled'}
                </Badge>
              )}
              {isSuccessConfiguration &&
                jitDbAccessConfiguration?.state === 'enabled' &&
                !jitDbAccessConfiguration.appliedSuccessfully && (
                  <span className="text-xs text-warning">Update pending</span>
                )}
            </div>
          </>
        )}
      </PageSectionContent>
    </PageSection>
  )
}
