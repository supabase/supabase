import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM, useParams } from 'common'
import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

import { FormHeader } from 'components/ui/Forms'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions, useSelectedOrganization } from 'hooks'
import { AlertCircle, ChevronDown } from 'lucide-react'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { CreateHookSheet } from './CreateHookSheet'
import { HookCard } from './HookCard'
import { HOOKS_DEFINITIONS, HOOK_DEFINITION_TITLE, Hook } from './hooks.constants'
import { extractMethod, isValidHook } from './hooks.utils'

export const HooksListing = () => {
  const { ref: projectRef } = useParams()
  const { data: authConfig, error: authConfigError, isError } = useAuthConfigQuery({ projectRef })
  const organization = useSelectedOrganization()
  const { data: subscription } = useOrgSubscriptionQuery(
    { orgSlug: organization?.slug },
    { enabled: IS_PLATFORM }
  )

  const [selectedHook, setSelectedHook] = useState<HOOK_DEFINITION_TITLE | null>(null)
  const [selectedHookForDeletion, setSelectedHookForDeletion] = useState<Hook | null>(null)

  const { mutateAsync: updateAuthConfig } = useAuthConfigUpdateMutation()
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  if (isError) {
    return (
      <Alert_Shadcn_ variant="destructive">
        <AlertCircle strokeWidth={2} />
        <AlertTitle_Shadcn_>Failed to retrieve auth configuration</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>{authConfigError.message}</AlertDescription_Shadcn_>
      </Alert_Shadcn_>
    )
  }

  // configuration for all auth hooks.
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

  const nonEnterpriseHookOptions = hooks.filter((h) => !isValidHook(h) && !h.enterprise)
  const enterpriseHookOptions = hooks.filter((h) => !isValidHook(h) && h.enterprise)

  return (
    <>
      <FormHeader
        title="Auth Hooks"
        description="Use Postgres functions or HTTP endpoints to customize the behavior of Supabase Auth to meet your needs."
        actions={
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                type="default"
                iconRight={<ChevronDown className="w-4 h-4" strokeWidth={1} />}
              >
                Add hook
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-76 p-0" align="end">
              <div className="p-1">
                {nonEnterpriseHookOptions.map((h) => (
                  <DropdownMenuItem key={h.title} onClick={() => setSelectedHook(h.title)}>
                    {h.title}
                  </DropdownMenuItem>
                ))}
              </div>
              {nonEnterpriseHookOptions.length > 0 && <DropdownMenuSeparator />}

              <div className="bg-surface-200 p-1 -mt-2">
                {subscription?.plan.id !== 'enterprise' && (
                  <DropdownMenuLabel className="grid gap-1 bg-surface-200">
                    <p className="text-foreground-light">Enterprise plan required</p>
                    <p className="text-foreground-lighter text-xs">
                      The following hooks are not available on{' '}
                      <a
                        target="_href"
                        href="https://forms.supabase.com/enterprise"
                        className="underline"
                      >
                        your plan
                      </a>
                      .
                    </p>
                  </DropdownMenuLabel>
                )}
                {enterpriseHookOptions.map((h) => (
                  <DropdownMenuItem
                    key={h.title}
                    disabled={true}
                    className="cursor-not-allowed"
                    onClick={() => setSelectedHook(h.title)}
                  >
                    {h.title}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      <div className="pb-2 -space-y-px">
        {hooks
          .filter((h) => isValidHook(h))
          .map((hook) => {
            return (
              <HookCard
                key={hook.enabledKey}
                hook={hook}
                canUpdateConfig={canUpdateConfig}
                onToggle={(enabled) =>
                  updateAuthConfig({
                    projectRef: projectRef!,
                    config: { [hook.enabledKey]: enabled },
                  })
                }
                onSelect={() => {
                  setSelectedHook(hook.title)
                }}
              />
            )
          })}
      </div>
      <CreateHookSheet
        title={selectedHook}
        visible={!!selectedHook}
        onDelete={() => {
          const hook = hooks.find((h) => h.title === selectedHook)
          if (hook) {
            setSelectedHookForDeletion(hook)
          }
        }}
        onClose={() => setSelectedHook(null)}
        authConfig={authConfig!}
      />
      <ConfirmationModal
        visible={!!selectedHookForDeletion}
        variant="destructive"
        title="Confirm to delete"
        confirmLabel="Delete"
        confirmLabelLoading="Deleting"
        onCancel={() => setSelectedHookForDeletion(null)}
        onConfirm={async () => {
          if (!selectedHookForDeletion) {
            return
          }
          await updateAuthConfig({
            projectRef: projectRef!,
            config: {
              [selectedHookForDeletion.enabledKey]: false,
              [selectedHookForDeletion.uriKey]: null,
              [selectedHookForDeletion.secretsKey]: null,
            },
          })
          toast.success(`${selectedHookForDeletion.title} has been deleted.`)
          setSelectedHookForDeletion(null)
          setSelectedHook(null)
        }}
      >
        <p className="py-4 text-sm text-foreground-light">
          {`Are you sure you want to delete the ${selectedHookForDeletion?.title}?`}
        </p>
      </ConfirmationModal>
    </>
  )
}
