import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ChevronDown } from 'lucide-react'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
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
  align?: 'end' | 'center'
  onSelectHook: (hook: HOOK_DEFINITION_TITLE) => void
}

export const AddHookDropdown = ({
  buttonText = 'Add hook',
  align = 'end',
  onSelectHook,
}: AddHookDropdownProps) => {
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()

  const { data: authConfig } = useAuthConfigQuery({ projectRef })
  const { can: canUpdateAuthHook } = useAsyncCheckPermissions(PermissionAction.AUTH_EXECUTE, '*')

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
    organization?.plan.id === 'team' || organization?.plan.id === 'enterprise'

  if (!canUpdateAuthHook) {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="primary" iconRight={<ChevronDown className="w-4 h-4" strokeWidth={1} />}>
          {buttonText}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-76" align={align}>
        <div>
          {nonEnterpriseHookOptions.map((h) => (
            <DropdownMenuItem key={h.title} onClick={() => onSelectHook(h.title)}>
              {h.title}
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator />

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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
