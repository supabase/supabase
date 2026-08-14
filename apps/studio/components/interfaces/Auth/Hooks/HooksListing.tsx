import { useParams } from 'common'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { AddHookDropdown } from './AddHookDropdown'
import { CreateHookSheet } from './CreateHookSheet'
import { DeleteHookConfirmationDialog } from './DeleteHookConfirmationDialog'
import { HookCard } from './HookCard'
import { Hook, HOOKS_DEFINITIONS } from './hooks.constants'
import { extractMethod, isValidHook } from './hooks.utils'
import { AlertError } from '@/components/ui/AlertError'
import { useAuthConfigQuery } from '@/data/auth/auth-config-query'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

export const HooksListing = () => {
  const { ref: projectRef } = useParams()

  const {
    data: authConfig,
    error: authConfigError,
    isError,
    isPending: isLoading,
  } = useAuthConfigQuery({ projectRef })

  const [hook, setHook] = useQueryState('hook', parseAsString)

  const [selectedHookForDeletion, setSelectedHookForDeletion] = useState<Hook>()
  const [addHookAsideOpen, setAddHookAsideOpen] = useState(false)
  const [addHookEmptyOpen, setAddHookEmptyOpen] = useState(false)

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
              variant="default"
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
            return (
              <HookCard
                key={hook.enabledKey}
                hook={hook}
                onSelectEdit={() => setHook(hook.id)}
                onSelectDelete={() => setSelectedHookForDeletion(hook)}
              />
            )
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

        <DeleteHookConfirmationDialog
          hook={selectedHookForDeletion}
          onOpenChange={(open) => {
            if (!open) setSelectedHookForDeletion(undefined)
          }}
          onDeleteSuccess={() => {
            setSelectedHookForDeletion(undefined)
            setHook(null)
          }}
        />
      </PageSectionContent>
    </PageSection>
  )
}
