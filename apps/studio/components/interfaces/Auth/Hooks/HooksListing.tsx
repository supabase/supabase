import { joinSqlFragments } from '@supabase/pg-meta/src/pg-format'
import { useParams } from 'common'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { cn } from 'ui'
import { Admonition, EmptyStatePresentational, GenericSkeletonLoader } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { AddHookDropdown } from './AddHookDropdown'
import { CreateHookSheet } from './CreateHookSheet'
import { HookCard } from './HookCard'
import { Hook, HOOKS_DEFINITIONS } from './hooks.constants'
import { extractMethod, getRevokePermissionStatements, isValidHook } from './hooks.utils'
import { FREE_TIER_TEMPLATE_BLOCK_CUTOFF_DATE } from '@/components/interfaces/Auth/EmailTemplates/EmailTemplates.utils'
import { isSmtpEnabled } from '@/components/interfaces/Auth/SmtpForm/SmtpForm.utils'
import AlertError from '@/components/ui/AlertError'
import CodeEditor from '@/components/ui/CodeEditor/CodeEditor'
import { useAuthConfigQuery } from '@/data/auth/auth-config-query'
import { useAuthHooksUpdateMutation } from '@/data/auth/auth-hooks-update-mutation'
import { executeSql } from '@/data/sql/execute-sql-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

export const HooksListing = () => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const {
    data: authConfig,
    error: authConfigError,
    isError,
    isPending: isLoading,
  } = useAuthConfigQuery({ projectRef })

  const [hook, setHook] = useQueryState('hook', parseAsString)

  const [selectedHookForDeletion, setSelectedHookForDeletion] = useState<Hook | null>(null)
  const [addHookAsideOpen, setAddHookAsideOpen] = useState(false)
  const [addHookEmptyOpen, setAddHookEmptyOpen] = useState(false)

  const { mutate: updateAuthHooks, isPending: isDeletingAuthHook } = useAuthHooksUpdateMutation({
    onSuccess: async () => {
      if (!selectedHookForDeletion) return

      const { method } = selectedHookForDeletion
      if (method.type === 'postgres') {
        const revokeStatements = getRevokePermissionStatements(method.schema, method.functionName)
        await executeSql({
          projectRef,
          connectionString: project!.connectionString,
          sql: joinSqlFragments(revokeStatements, '\n'),
        })
      }
      toast.success(`${selectedHookForDeletion.title} has been deleted.`)
      setSelectedHookForDeletion(null)
      setHook(null)
    },
    onError: (error) => {
      toast.error(`Failed to delete hook: ${error.message}`)
    },
  })

  const hooks: Hook[] = HOOKS_DEFINITIONS.map((definition) => {
    return {
      ...definition,
      enabled: authConfig?.[definition.enabledKey] || false,
      method: extractMethod(
        authConfig?.[definition.uriKey] || '',
        authConfig?.[definition.secretsKey] || ''
      ),
    }
  })

  const validHooks = hooks.filter((h) => isValidHook(h))
  const hasValidHooks = validHooks.length > 0

  // When deleting the send-email hook on a post-cutoff free project without custom SMTP,
  // templates will resume being used but editing will be locked.
  const isDeletingSendEmailHook = selectedHookForDeletion?.id === 'send-email'
  const willLockTemplatesOnHookDelete =
    isDeletingSendEmailHook &&
    !!selectedOrganization &&
    selectedOrganization.plan?.id === 'free' &&
    !!project?.inserted_at &&
    project.inserted_at >= FREE_TIER_TEMPLATE_BLOCK_CUTOFF_DATE &&
    !isSmtpEnabled(authConfig)

  useShortcut(
    SHORTCUT_IDS.LIST_PAGE_NEW_ITEM,
    () => (hasValidHooks ? setAddHookAsideOpen(true) : setAddHookEmptyOpen(true)),
    { label: 'Add hook' }
  )

  const selectedHook = hooks.find((h) => h.id === hook)

  useEffect(() => {
    if (!!hook && !selectedHook) {
      toast('Hook not found')
      setHook(null)
    }
  }, [hook, selectedHook, setHook])

  if (isError) {
    return (
      <PageSection>
        <PageSectionContent>
          <AlertError
            error={authConfigError}
            subject="Failed to retrieve auth configuration for hooks"
          />
        </PageSectionContent>
      </PageSection>
    )
  }

  if (isLoading) {
    return (
      <PageSection>
        <PageSectionContent>
          <GenericSkeletonLoader />
        </PageSectionContent>
      </PageSection>
    )
  }

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Hooks</PageSectionTitle>
        </PageSectionSummary>
        <PageSectionAside>
          <AddHookDropdown
            open={addHookAsideOpen}
            onOpenChange={setAddHookAsideOpen}
            onSelectHook={(title) => {
              const hook = hooks.find((h) => h.title === title)
              if (hook) setHook(hook.id)
            }}
          />
        </PageSectionAside>
      </PageSectionMeta>
      <PageSectionContent>
        {!hasValidHooks && (
          <EmptyStatePresentational
            title="Create an auth hook"
            description="Use Postgres functions or HTTP endpoints to customize your authentication flow."
          >
            <AddHookDropdown
              type="default"
              align="center"
              buttonText="Add a new hook"
              open={addHookEmptyOpen}
              onOpenChange={setAddHookEmptyOpen}
              onSelectHook={(title) => {
                const hook = hooks.find((h) => h.title === title)
                if (hook) setHook(hook.id)
              }}
            />
          </EmptyStatePresentational>
        )}

        <div className="-space-y-px">
          {validHooks.map((hook) => {
            return <HookCard key={hook.enabledKey} hook={hook} onSelect={() => setHook(hook.id)} />
          })}
        </div>

        <CreateHookSheet
          title={selectedHook?.title ?? null}
          visible={!!selectedHook}
          onDelete={() => {
            const hook = hooks.find((h) => h.title === selectedHook?.title)
            if (hook) setSelectedHookForDeletion(hook)
          }}
          onClose={() => setHook(null)}
          authConfig={authConfig!}
        />

        <ConfirmationModal
          visible={!!selectedHookForDeletion}
          size="large"
          variant="destructive"
          loading={isDeletingAuthHook}
          title={`Confirm to delete ${selectedHookForDeletion?.title}`}
          className={cn('md:px-0', selectedHookForDeletion?.method.type === 'postgres' && 'pb-0')}
          confirmLabel="Delete"
          confirmLabelLoading="Deleting"
          onCancel={() => setSelectedHookForDeletion(null)}
          onConfirm={() => {
            if (!selectedHookForDeletion) return
            updateAuthHooks({
              projectRef: projectRef!,
              config: {
                [selectedHookForDeletion.enabledKey]: false,
                [selectedHookForDeletion.uriKey]: null,
                [selectedHookForDeletion.secretsKey]: null,
              },
            })
          }}
        >
          <div>
            <p className="md:px-5 text-sm text-foreground-light">
              Are you sure you want to delete the {selectedHookForDeletion?.title}?
            </p>
            {isDeletingSendEmailHook && (
              <Admonition
                type={willLockTemplatesOnHookDelete ? 'warning' : 'default'}
                title={
                  willLockTemplatesOnHookDelete
                    ? 'Email templates will be locked'
                    : 'Email templates will resume being used'
                }
                description={
                  willLockTemplatesOnHookDelete
                    ? "Auth will revert to sending emails using your templates, but on the free plan without custom SMTP they can't be edited. Set up custom SMTP to regain editing access."
                    : 'Auth will revert to sending emails using your templates.'
                }
                className="md:mx-5 mt-3"
              />
            )}
            {selectedHookForDeletion?.method.type === 'postgres' && (
              <>
                <p className="md:px-5 text-sm text-foreground-light mt-3">
                  The following statements will be executed on the{' '}
                  {selectedHookForDeletion?.method.schema}.
                  {selectedHookForDeletion?.method.functionName} function:
                </p>
                <div className="mt-4 h-72">
                  <CodeEditor
                    isReadOnly
                    id="deletion-hook-editor"
                    language="pgsql"
                    value={getRevokePermissionStatements(
                      selectedHookForDeletion?.method.schema,
                      selectedHookForDeletion?.method.functionName
                    ).join('\n\n')}
                  />
                </div>
              </>
            )}
          </div>
        </ConfirmationModal>
      </PageSectionContent>
    </PageSection>
  )
}
