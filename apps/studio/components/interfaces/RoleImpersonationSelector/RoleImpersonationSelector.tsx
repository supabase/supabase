import { useState } from 'react'

import { PostgrestRole } from 'lib/role-impersonation'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { AnonIcon, AuthenticatedIcon, ServiceRoleIcon } from './Icons'
import RoleImpersonationRadio from './RoleImpersonationRadio'
import UserImpersonationSelector from './UserImpersonationSelector'

export interface RoleImpersonationSelectorProps {
  serviceRoleLabel?: string
}

const RoleImpersonationSelector = ({ serviceRoleLabel }: RoleImpersonationSelectorProps) => {
  const state = useRoleImpersonationStateSnapshot()

  const [selectedOption, setSelectedOption] = useState<PostgrestRole | undefined>(() => {
    if (
      state.role?.type === 'postgrest' &&
      (state.role.role === 'anon' || state.role.role === 'authenticated')
    ) {
      return state.role.role
    }

    return 'service_role'
  })

  const isAuthenticatedOptionFullySelected = Boolean(
    selectedOption === 'authenticated' &&
      state.role?.type === 'postgrest' &&
      state.role.role === 'authenticated' &&
      state.role.user
  )

  function onSelectedChange(value: PostgrestRole) {
    if (value === 'service_role') {
      // do not set a role for service role
      // as the default role is the "service role"
      state.setRole(undefined)
    }

    if (value === 'anon') {
      state.setRole({
        type: 'postgrest',
        role: value,
      })
    }

    setSelectedOption(value)
  }

  function onStopImpersonatingUser() {
    setSelectedOption('service_role')
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-foreground text-base">Database connection settings</h2>

      <form
        className="flex gap-4"
        onSubmit={(e) => {
          // don't allow form submission
          e.preventDefault()
        }}
      >
        <RoleImpersonationRadio
          value="service_role"
          isSelected={selectedOption === 'service_role'}
          onSelectedChange={onSelectedChange}
          label={serviceRoleLabel}
          icon={<ServiceRoleIcon isSelected={selectedOption === 'service_role'} />}
        />

        <RoleImpersonationRadio
          value="anon"
          isSelected={selectedOption === 'anon'}
          onSelectedChange={onSelectedChange}
          icon={<AnonIcon isSelected={selectedOption === 'anon'} />}
        />

        <RoleImpersonationRadio
          value="authenticated"
          isSelected={
            selectedOption === 'authenticated' &&
            (isAuthenticatedOptionFullySelected || 'partially')
          }
          onSelectedChange={onSelectedChange}
          icon={<AuthenticatedIcon isSelected={selectedOption === 'authenticated'} />}
        />
      </form>

      <div className="text-foreground-light text-sm">
        {selectedOption === 'service_role' && (
          <p>
            The default Postgres/superuser role. This has admin privileges.
            <br />
            It will bypass Row Level Security (RLS) policies.
          </p>
        )}

        {selectedOption === 'anon' && (
          <p>
            For "anonymous access". This is the role which the API (PostgREST) will use when a user
            <br />
            is not logged in. It will respect Row Level Security (RLS) policies.
          </p>
        )}

        {selectedOption === 'authenticated' && (
          <div className="flex flex-col gap-4">
            <p>
              For "authenticated access". This is the role which the API (PostgREST) will use when
              <br /> a user is logged in. It will respect Row Level Security (RLS) policies.
            </p>

            <hr />

            <UserImpersonationSelector onStopImpersonatingUser={onStopImpersonatingUser} />
          </div>
        )}
      </div>
    </div>
  )
}

export default RoleImpersonationSelector
