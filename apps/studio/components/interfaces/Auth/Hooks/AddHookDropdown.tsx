import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ChevronDown } from 'lucide-react'
import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { InlineLink } from 'components/ui/InlineLink'
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
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import { useMemo } from 'react'

interface AddHookDropdownProps {
  buttonText?: string
  align?: 'end' | 'center'
  type?: 'primary' | 'default'
  onSelectHook: (hook: HOOK_DEFINITION_TITLE) => void
}

export const AddHookDropdown = ({
  buttonText = 'Add hook',
  align = 'end',
  type = 'primary',
  onSelectHook,
}: AddHookDropdownProps) => {
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()

  const { data: authConfig } = useAuthConfigQuery({ projectRef })
  const { can: canUpdateAuthHook } = useAsyncCheckPermissions(PermissionAction.AUTH_EXECUTE, '*')
  const { getEntitlementSetValues: getEntitledHookSet } = useCheckEntitlements('auth.hooks')
  const entitledHookSet = getEntitledHookSet()

  const { availableHooks, nonAvailableHooks } = useMemo(() => {
    const allHooks: Hook[] = HOOKS_DEFINITIONS.map((definition) => ({
      ...definition,
      enabled: authConfig?.[definition.enabledKey] || false,
      method: extractMethod(
        authConfig?.[definition.uriKey] || '',
        authConfig?.[definition.secretsKey] || ''
      ),
    }))

    const availableHooks: Hook[] = allHooks.filter(
      (h) => !isValidHook(h) && entitledHookSet.includes(h.entitlementKey)
    )

    const nonAvailableHooks: Hook[] = allHooks.filter(
      (h) => !isValidHook(h) && !entitledHookSet.includes(h.entitlementKey)
    )

    return { availableHooks, nonAvailableHooks }
  }, [entitledHookSet, authConfig])

  if (!canUpdateAuthHook) {
    return (
      <ButtonTooltip
        disabled
        type={type}
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
        <Button type={type} iconRight={<ChevronDown />}>
          {buttonText}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-76" align={align}>
        <div>
          {availableHooks.length === 0 && (
            <DropdownMenuLabel className="text-foreground-light">
              All available hooks have been added
            </DropdownMenuLabel>
          )}
          {availableHooks.map((h) => (
            <DropdownMenuItem key={h.title} onClick={() => onSelectHook(h.title)}>
              {h.title}
            </DropdownMenuItem>
          ))}
        </div>
        {nonAvailableHooks.length > 0 && (
          <>
            {availableHooks.length > 0 && <DropdownMenuSeparator />}

            <DropdownMenuLabel className="grid gap-1 bg-surface-200">
              <p className="text-foreground-light">Team or Enterprise Plan required</p>
              <p className="text-foreground-lighter text-xs">
                The following hooks are not available on{' '}
                <InlineLink href={`/org/${organization?.slug ?? '_'}/billing`}>
                  your plan
                </InlineLink>
                .
              </p>
            </DropdownMenuLabel>

            {nonAvailableHooks.map((h) => (
              <DropdownMenuItem key={h.title} disabled={true}>
                {h.title}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
