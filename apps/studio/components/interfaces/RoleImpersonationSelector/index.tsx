import { Check, Database, UserCheck, UserX } from 'lucide-react'
import { Separator, ToggleGroup, ToggleGroupItem } from 'ui'

import { UserImpersonationSelector } from './UserImpersonationSelector'
import { useRoleImpersonationSelection } from './useRoleImpersonationSelection'
import {
  useRoleImpersonationStateSnapshot,
  type RoleImpersonationController,
} from '@/state/role-impersonation-state'

export interface RoleImpersonationSelectorProps {
  header?: string
  serviceRoleLabel?: string
  disallowAuthenticatedOption?: boolean
  title?: string
  orientation?: 'horizontal' | 'vertical'
}

/**
 * Tightly coupled with the global role impersonation store.
 * Use RoleImpersonationSelectorInterface to control the logic externally.
 */
export const RoleImpersonationSelector = (props: RoleImpersonationSelectorProps) => {
  const state = useRoleImpersonationStateSnapshot() as unknown as RoleImpersonationController

  return <RoleImpersonationSelectorInterface {...props} state={state} />
}

type RoleImpersonationSelectorInterfaceProps = RoleImpersonationSelectorProps & {
  state: RoleImpersonationController
}

export const RoleImpersonationSelectorInterface = (
  props: RoleImpersonationSelectorInterfaceProps
) => {
  const { state } = props
  const serviceRoleLabel = props.serviceRoleLabel ?? 'Postgres'
  const disallowAuthenticatedOption = props.disallowAuthenticatedOption ?? false
  const { selectedOption, onSelectedChange, keepAuthenticatedSelected } =
    useRoleImpersonationSelection(state)

  const roleSummary = {
    service_role: 'Bypasses RLS and can return all rows.',
    anon: 'Returns rows available to anonymous users.',
    authenticated: 'Returns rows available to the selected user.',
  }[selectedOption]

  return (
    <div className="flex w-80 flex-col">
      <form
        className="p-3"
        onSubmit={(event) => {
          event.preventDefault()
        }}
      >
        <ToggleGroup
          type="single"
          orientation="vertical"
          value={selectedOption}
          onValueChange={(value) => {
            if (value === 'service_role' || value === 'anon' || value === 'authenticated') {
              void onSelectedChange(value)
            }
          }}
          variant="default"
          aria-label={props.header ?? props.title ?? 'Run query as role'}
          className="w-full flex-col items-stretch gap-0.5"
        >
          <ToggleGroupItem value="service_role" className="w-full justify-between text-left">
            <span className="flex min-w-0 items-center gap-3">
              <Database size={16} strokeWidth={1.5} className="shrink-0" />
              <span className="flex min-w-0 flex-col items-start">
                <span>{serviceRoleLabel}</span>
                <span className="text-xs font-normal text-foreground-lighter">Superuser</span>
              </span>
            </span>
            {selectedOption === 'service_role' && <Check size={14} />}
          </ToggleGroupItem>

          <ToggleGroupItem value="anon" className="w-full justify-between text-left">
            <span className="flex min-w-0 items-center gap-3">
              <UserX size={16} strokeWidth={1.5} className="shrink-0" />
              <span className="flex min-w-0 flex-col items-start">
                <span>Anonymous</span>
                <span className="text-xs font-normal text-foreground-lighter">Not logged in</span>
              </span>
            </span>
            {selectedOption === 'anon' && <Check size={14} />}
          </ToggleGroupItem>

          {!disallowAuthenticatedOption && (
            <ToggleGroupItem value="authenticated" className="w-full justify-between text-left">
              <span className="flex min-w-0 items-center gap-3">
                <UserCheck size={16} strokeWidth={1.5} className="shrink-0" />
                <span className="flex min-w-0 flex-col items-start">
                  <span>Authenticated</span>
                  <span className="text-xs font-normal text-foreground-lighter">
                    Logged-in user
                  </span>
                </span>
              </span>
              {selectedOption === 'authenticated' && <Check size={14} />}
            </ToggleGroupItem>
          )}
        </ToggleGroup>

        {!disallowAuthenticatedOption && (
          <>
            <Separator className="my-2.5" />
            <UserImpersonationSelector
              state={state}
              disabled={selectedOption !== 'authenticated'}
              onUserImpersonationCleared={keepAuthenticatedSelected}
            />
          </>
        )}
      </form>
      <Separator />
      <footer className="px-3 py-2">
        <p aria-live="polite" className="text-xs text-foreground-lighter">
          {roleSummary}
        </p>
      </footer>
    </div>
  )
}
