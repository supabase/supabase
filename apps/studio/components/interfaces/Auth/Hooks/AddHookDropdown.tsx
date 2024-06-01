import { ChevronDown } from 'lucide-react'

import { useParams } from 'common'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
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
import { useSelectedOrganization } from 'hooks'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { IS_PLATFORM } from 'lib/constants'

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
  const { data: authConfig, error: authConfigError, isError } = useAuthConfigQuery({ projectRef })

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
              onClick={() => onSelectHook(h.title)}
            >
              {h.title}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
