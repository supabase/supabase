import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import CodeEditor from 'components/ui/CodeEditor/CodeEditor'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthHooksUpdateMutation } from 'data/auth/auth-hooks-update-mutation'
import { executeSql } from 'data/sql/execute-sql-query'
import { useQueryStateWithSelect } from 'hooks/misc/useQueryStateWithSelect'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { cn } from 'ui'
import { EmptyStatePresentational, GenericSkeletonLoader } from 'ui-patterns'
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
import { HOOKS_DEFINITIONS, Hook } from './hooks.constants'
import { extractMethod, getRevokePermissionStatements, isValidHook } from './hooks.utils'

export const HooksListing = () => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const {
    data: authConfig,
    error: authConfigError,
    isError,
    isPending: isLoading,
  } = useAuthConfigQuery({ projectRef })

  const [selectedHookForDeletion, setSelectedHookForDeletion] = useState<Hook | null>(null)

  const { mutate: updateAuthHooks, isPending: isDeletingAuthHook } = useAuthHooksUpdateMutation({
    onSuccess: async () => {
      if (!selectedHookForDeletion) return

      const { method } = selectedHookForDeletion
      if (method.type === 'postgres') {
        const revokeStatements = getRevokePermissionStatements(method.schema, method.functionName)
        await executeSql({
          projectRef,
          connectionString: project!.connectionString,
          sql: revokeStatements.join('\n'),
        })
      }
      toast.success(`${selectedHookForDeletion.title} has been deleted.`)
      setSelectedHookForDeletion(null)
      setSelectedHook(null)
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

  const { setValue: setSelectedHook, value: selectedHook } = useQueryStateWithSelect({
    urlKey: 'hook',
    select: (id: string) => {
      if (!id) return null
      const hook = hooks.find((h) => h.id === id)
      return hook ? hook.title : undefined
    },
    enabled: !!hooks && hooks.length > 0,
    onError: () => toast.error(`Hook not found`),
  })

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
            onSelectHook={(title) => {
              const hook = hooks.find((h) => h.title === title)
              if (hook) setSelectedHook(hook.id)
            }}
          />
        </PageSectionAside>
      </PageSectionMeta>
      <PageSectionContent>
        {hooks.filter((h) => isValidHook(h)).length === 0 && (
          <EmptyStatePresentational
            title="Create an auth hook"
            description="Use Postgres functions or HTTP endpoints to customize your authentication flow."
          >
            <AddHookDropdown
              type="default"
              align="center"
              buttonText="Add a new hook"
              onSelectHook={(title) => {
                const hook = hooks.find((h) => h.title === title)
                if (hook) setSelectedHook(hook.id)
              }}
            />
          </EmptyStatePresentational>
        )}

        <div className="-space-y-px">
          {hooks
            .filter((h) => isValidHook(h))
            .map((hook) => {
              return (
                <HookCard
                  key={hook.enabledKey}
                  hook={hook}
                  onSelect={() => setSelectedHook(hook.id)}
                />
              )
            })}
        </div>

        <CreateHookSheet
          title={selectedHook ?? null}
          visible={!!selectedHook}
          onDelete={() => {
            const hook = hooks.find((h) => h.title === selectedHook)
            if (hook) setSelectedHookForDeletion(hook)
          }}
          onClose={() => setSelectedHook(null)}
          authConfig={authConfig!}
        />

        <ConfirmationModal
          visible={!!selectedHookForDeletion}
          size="large"
          variant="destructive"
          loading={isDeletingAuthHook}
          title={`Confirm to delete ${selectedHookForDeletion?.title}`}
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
            <p className="text-sm text-foreground-light">
              Are you sure you want to delete the {selectedHookForDeletion?.title}?
            </p>
            {selectedHookForDeletion?.method.type === 'postgres' && (
              <>
                <p className="text-sm text-foreground-light">
                  The following statements will be executed on the{' '}
                  {selectedHookForDeletion?.method.schema}.
                  {selectedHookForDeletion?.method.functionName} function:
                </p>
                <div className={cn('mt-4', 'h-72')}>
                  <CodeEditor
                    id="deletion-hook-editor"
                    isReadOnly={true}
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
