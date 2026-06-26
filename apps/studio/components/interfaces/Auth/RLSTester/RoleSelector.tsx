import { RadioGroupStacked, RadioGroupStackedItem } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { useRoleImpersonationStateSnapshot } from '@/state/role-impersonation-state'

interface RoleSelectorProps {
  onSelectRole: (value: 'anon' | 'authenticated') => void
}

export const RoleSelector = ({ onSelectRole }: RoleSelectorProps) => {
  const { role, setRole } = useRoleImpersonationStateSnapshot()

  return (
    <FormItemLayout isReactForm={false} label="Test as">
      <RadioGroupStacked defaultValue={role?.role ?? 'anon'}>
        <RadioGroupStackedItem
          value="anon"
          id="anon"
          label="Anonymous user"
          description="Not logged in"
          onClick={() => {
            onSelectRole('anon')
            setRole({ type: 'postgrest', role: 'anon' })
          }}
        />
        <RadioGroupStackedItem
          value="authenticated"
          id="authenticated"
          label="Authenticated user"
          description="A specific logged in user"
          onClick={() => {
            onSelectRole('authenticated')
          }}
        />
      </RadioGroupStacked>
    </FormItemLayout>
  )
}
