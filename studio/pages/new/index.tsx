import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, Typography } from '@supabase/ui'
import { useRouter } from 'next/router'

import { API_URL } from 'lib/constants'
import { useStore, withAuth } from 'hooks'
import { post } from 'lib/common/fetch'
import { WizardLayout } from 'components/layouts'
import FormField from 'components/to-be-cleaned/forms/FormField'
import Panel from 'components/to-be-cleaned/Panel'

/**
 * No org selected yet, create a new one
 */
const Wizard = () => {
  const { ui, app } = useStore()
  const router = useRouter()

  const [orgName, setOrgName] = useState('')
  const [newOrgLoading, setNewOrgLoading] = useState(false)

  function validateOrgName(name: any) {
    const value = name ? name.trim() : ''
    return value.length >= 1
  }

  function onOrgNameChange(e: any) {
    setOrgName(e.target.value)
  }

  async function onClickSubmit(e: any) {
    e.preventDefault()
    const isOrgNameValid = validateOrgName(orgName)
    if (!isOrgNameValid) {
      ui.setNotification({ category: 'error', message: 'Organization name is empty' })
      return
    }

    setNewOrgLoading(true)
    const response = await post(`${API_URL}/organizations/new`, {
      name: orgName,
    })

    if (response.error) {
      setNewOrgLoading(false)
      ui.setNotification({
        category: 'error',
        message: `Failed to create organization: ${response.error?.message ?? response.error}`,
      })
    } else {
      const org = response
      app.onOrgAdded(org)
      router.push(`/new/${org.slug}`)
    }
  }

  return (
    <WizardLayout organization={null} project={null}>
      <Panel
        hideHeaderStyling
        title={[
          <div key="panel-title">
            <Typography.Title level={4} className="mb-0">
              Create a new organization
            </Typography.Title>
          </div>,
        ]}
        footer={[
          <div key="panel-footer" className="flex items-center w-full justify-between">
            <Button type="default" onClick={() => router.push('/')}>
              Cancel
            </Button>
            <div className="space-x-3">
              <Typography.Text type="secondary" small>
                You can rename your organization later
              </Typography.Text>
              <Button onClick={onClickSubmit} loading={newOrgLoading} disabled={newOrgLoading}>
                Create organization
              </Button>
            </div>
          </div>,
        ]}
      >
        <Panel.Content className="pt-0">
          <Typography.Text>
            This is your organization's name within Supabase.
            <br />
          </Typography.Text>
          <Typography.Text type="secondary">
            For example, you can use the name of your company or department
          </Typography.Text>
        </Panel.Content>
        <Panel.Content className="Form section-block--body has-inputs-centered">
          <FormField
            // @ts-ignore
            label="Name"
            type="text"
            placeholder="Organization name"
            value={orgName}
            onChange={onOrgNameChange}
            description="What's the name of your company or team?"
            wrapperClasses="pb-2"
            autoFocus
          />
        </Panel.Content>
      </Panel>
    </WizardLayout>
  )
}

export default withAuth(observer(Wizard))
