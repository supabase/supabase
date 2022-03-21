import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, Input, Typography } from '@supabase/ui'
import { useRouter } from 'next/router'

import { API_URL } from 'lib/constants'
import { useStore, withAuth } from 'hooks'
import { post } from 'lib/common/fetch'
import { WizardLayout } from 'components/layouts'
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
    const response = await post(`${API_URL}/organizations`, {
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
            <h4>Create a new organization</h4>
          </div>,
        ]}
        footer={[
          <div key="panel-footer" className="flex items-center w-full justify-between">
            <Button type="default" onClick={() => router.push('/')}>
              Cancel
            </Button>
            <div className="flex items-center space-x-3">
              <p className="text-xs text-scale-900">You can rename your organization later</p>
              <Button onClick={onClickSubmit} loading={newOrgLoading} disabled={newOrgLoading}>
                Create organization
              </Button>
            </div>
          </div>,
        ]}
      >
        <Panel.Content className="pt-0">
          <p className="text-sm">This is your organization's name within Supabase.</p>
          <p className="text-sm text-scale-1100">
            For example, you can use the name of your company or department
          </p>
        </Panel.Content>
        <Panel.Content className="Form section-block--body has-inputs-centered">
          <Input
            autoFocus
            label="Name"
            type="text"
            layout="horizontal"
            placeholder="Organization name"
            descriptionText="What's the name of your company or team?"
            value={orgName}
            onChange={onOrgNameChange}
          />
        </Panel.Content>
      </Panel>
    </WizardLayout>
  )
}

export default withAuth(observer(Wizard))
