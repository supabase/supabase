import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useFlag, useStore, checkPermissions } from 'hooks'
import { Input } from '@supabase/ui'
import Panel from 'components/ui/Panel'
import {
  FormActions,
  FormPanel,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from 'components/ui/Forms'

const BillingEmail = () => {
  const enablePermissions = useFlag('enablePermissions')

  const { ui } = useStore()

  const canUpdateOrganization = enablePermissions
    ? checkPermissions(PermissionAction.UPDATE, 'organizations')
    : ui.selectedOrganization?.is_owner

  const canReadBillingEmail = checkPermissions(PermissionAction.READ, 'organizations')

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h4>Billing email</h4>
          </div>
          <p className="text-sm opacity-50">The email to be used for billing</p>
        </div>
      </div>
      <Panel>
        <form>
          <Input
            id="billing_email"
            size="small"
            label="Billing email"
            type={canReadBillingEmail ? 'text' : 'password'}
            disabled={!canUpdateOrganization}
          />
        </form>
      </Panel>
    </>
  )
}

export default BillingEmail
