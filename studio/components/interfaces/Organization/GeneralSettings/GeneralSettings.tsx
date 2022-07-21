import { useContext } from 'react'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import { AutoField } from 'uniforms-bootstrap4'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useStore } from 'hooks'
import { API_URL } from 'lib/constants'
import { patch } from 'lib/common/fetch'
import { checkPermissions } from 'lib/common/permissions'
import { pluckJsonSchemaFields, pluckObjectFields } from 'lib/helpers'
import { organizations } from 'stores/jsonSchema'
import OrganizationDeletePanel from './OrganizationDeletePanel'
import SchemaFormPanel from 'components/to-be-cleaned/forms/SchemaFormPanel'

import { PageContext } from 'pages/org/[slug]/settings'

const GeneralSettings = observer(() => {
  const PageState: any = useContext(PageContext)
  const { ui } = useStore()
  const canUpdateOrganization = checkPermissions(
    PermissionAction.SQL_UPDATE,
    'postgres.public.organizations'
  )

  const formModel = toJS(PageState.organization)
  // remove warning null value for controlled input
  if (!formModel.billing_email) formModel.billing_email = ''
  const BASIC_FIELDS = ['name', 'billing_email']

  const handleUpdateOrg = async (model: any) => {
    const response = await patch(`${API_URL}/organizations/${PageState.organization.slug}`, model)
    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to update organization: ${response.error.message}`,
      })
    } else {
      const updatedOrg = response
      PageState.onOrgUpdated(updatedOrg)
      ui.setNotification({
        category: 'success',
        message: 'Successfully saved settings',
      })
    }
  }

  return (
    <article className="container my-4 max-w-4xl space-y-8">
      <SchemaFormPanel
        title="General"
        schema={pluckJsonSchemaFields(organizations, BASIC_FIELDS)}
        model={formModel}
        onSubmit={(model: any) => handleUpdateOrg(pluckObjectFields(model, BASIC_FIELDS))}
      >
        <AutoField
          className="auto-field"
          name="name"
          showInlineError
          errorMessage="Please enter an organization name"
          disabled={!canUpdateOrganization}
        />
        <AutoField
          name="billing_email"
          showInlineError
          errorMessage="Please enter an email address"
          disabled={!canUpdateOrganization}
        />
      </SchemaFormPanel>

      <OrganizationDeletePanel />
    </article>
  )
})

export default GeneralSettings
