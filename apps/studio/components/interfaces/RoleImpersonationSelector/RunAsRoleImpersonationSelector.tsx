import { Check } from 'lucide-react'
import { Separator, ToggleGroup, ToggleGroupItem } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { UserImpersonationSelector } from './UserImpersonationSelector'
import { useRoleImpersonationSelection } from './useRoleImpersonationSelection'
import type { RoleImpersonationController } from '@/state/role-impersonation-state'

type RunAsRoleImpersonationSelectorProps = {
  state: RoleImpersonationController
}

export const RunAsRoleImpersonationSelector = ({ state }: RunAsRoleImpersonationSelectorProps) => {
  const { selectedOption, onSelectedChange } = useRoleImpersonationSelection(state)

  const roleSummary = {
    service_role: 'Bypasses RLS and can return all rows.',
    anon: 'Returns rows available to anonymous users.',
    authenticated: 'Returns rows available to the selected user.',
  }[selectedOption]

  return (
    <div className="flex flex-col">
      <form
        className="p-3"
        onSubmit={(event) => {
          event.preventDefault()
        }}
      >
        <FormItemLayout isReactForm={false} layout="horizontal" size="tiny" label="Role">
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
            aria-label="Run query as role"
            className="w-full flex-col items-stretch gap-0.5"
          >
            <ToggleGroupItem value="service_role" className="w-full justify-between text-left">
              <span className="flex min-w-0 flex-col items-start">
                <span>Postgres</span>
                <span className="text-xs font-normal text-foreground-lighter">Superuser</span>
              </span>
              {selectedOption === 'service_role' && <Check size={14} />}
            </ToggleGroupItem>

            <ToggleGroupItem value="anon" className="w-full justify-between text-left">
              <span className="flex min-w-0 flex-col items-start">
                <span>Anonymous</span>
                <span className="text-xs font-normal text-foreground-lighter">Not logged in</span>
              </span>
              {selectedOption === 'anon' && <Check size={14} />}
            </ToggleGroupItem>

            <ToggleGroupItem value="authenticated" className="w-full justify-between text-left">
              <span className="flex min-w-0 flex-col items-start">
                <span>Authenticated</span>
                <span className="text-xs font-normal text-foreground-lighter">Logged-in user</span>
              </span>
              {selectedOption === 'authenticated' && <Check size={14} />}
            </ToggleGroupItem>
          </ToggleGroup>
        </FormItemLayout>

        <Separator className="my-2.5" />
        <UserImpersonationSelector
          state={state}
          compact
          disabled={selectedOption !== 'authenticated'}
        />
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
