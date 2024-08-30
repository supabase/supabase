import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ChevronDown } from 'lucide-react'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from 'lib/constants'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import { HOOKS_DEFINITIONS, HOOK_DEFINITION_TITLE, Hook } from './hooks.constants'
import { extractMethod, isValidHook } from './hooks.utils'

interface AddHookDropdownProps {
  buttonText?: string
  onSelectHook: (hook: HOOK_DEFINITION_TITLE) => void
}

export const AddHookDropdown = ({
  buttonText = 'Add hook',
  onSelectHook,
}: AddHookDropdownProps) => {
  const { ref: projectRef } = useParams()
  const organization = useSelectedOrganization()

  const { data: subscription } = useOrgSubscriptionQuery(
    { orgSlug: organization?.slug },
    { enabled: IS_PLATFORM }
  )
  const { data: authConfig } = useAuthConfigQuery({ projectRef })
  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

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

  const isTeamsOrEnterprisePlan =
    subscription?.plan.id === 'team' || subscription?.plan.id === 'enterprise'

  if (!canUpdateConfig) {
    return (
      <ButtonTooltip
        disabled
        type="primary"
        tooltip={{
          content: { side: 'bottom', text: 'You need additional permissions to add auth hooks' },
        }}
      >
        {buttonText}
      </ButtonTooltip>
    )
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button type="primary" iconRight={<ChevronDown className="w-4 h-4" strokeWidth={1} />}>
          {buttonText}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-76 p-0" align="end">
        <div className="p-1">
          {nonEnterpriseHookOptions.map((h) => (
            <DropdownMenuItem key={h.title} onClick={() => onSelectHook(h.title)}>
              {h.title}
            </DropdownMenuItem>
          ))}
        </div>
        {nonEnterpriseHookOptions.length > 0 && <DropdownMenuSeparator />}

        <div className="bg-surface-200 p-1 -mt-2">
          {!isTeamsOrEnterprisePlan && (
            <DropdownMenuLabel className="grid gap-1 bg-surface-200">
              <p className="text-foreground-light">Team or Enterprise Plan required</p>
              <p className="text-foreground-lighter text-xs">
                The following hooks are not available on{' '}
                <a
                  target="_href"
                  href={`https://supabase.com/dashboard/org/${organization?.slug ?? '_'}/billing`}
                  className="underline"
                >
                  your plan
                </a>
                .
              </p>
            </DropdownMenuLabel>
          )}
          {enterpriseHookOptions.map((h) =>
            isTeamsOrEnterprisePlan ? (
              <DropdownMenuItem
                key={h.title}
                disabled={!isTeamsOrEnterprisePlan}
                className=""
                onClick={() => onSelectHook(h.title)}
              >
                {h.title}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                key={h.title}
                disabled={!isTeamsOrEnterprisePlan}
                onClick={() => onSelectHook(h.title)}
              >
                {h.title}
              </DropdownMenuItem>
            )
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
