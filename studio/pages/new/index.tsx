import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, Input, Listbox } from 'ui'
import { useRouter } from 'next/router'

import { API_URL } from 'lib/constants'
import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { WizardLayout } from 'components/layouts'
import Panel from 'components/ui/Panel'
import { NextPageWithLayout } from 'types'

const ORG_KIND_TYPES = {
  PERSONAL: 'Personal',
  EDUCATIONAL: 'Educational',
  STARTUP: 'Startup',
  AGENCY: 'Agency',
  COMPANY: 'Company',
  UNDISCLOSED: 'N/A',
}
const ORG_KIND_DEFAULT = 'PERSONAL'

const ORG_SIZE_TYPES = {
  '1': '1 - 10',
  '10': '10 - 49',
  '50': '50 - 99',
  '100': '100 - 299',
  '300': 'More than 300',
}
const ORG_SIZE_DEFAULT = '1'

/**
 * No org selected yet, create a new one
 */
const Wizard: NextPageWithLayout = () => {
  const { ui, app } = useStore()
  const router = useRouter()

  const [orgName, setOrgName] = useState('')
  const [orgKind, setOrgKind] = useState(ORG_KIND_DEFAULT)
  const [orgSize, setOrgSize] = useState(ORG_SIZE_DEFAULT)
  const [newOrgLoading, setNewOrgLoading] = useState(false)

  function validateOrgName(name: any) {
    const value = name ? name.trim() : ''
    return value.length >= 1
  }

  function onOrgNameChange(e: any) {
    setOrgName(e.target.value)
  }

  function onOrgKindChange(value: any) {
    setOrgKind(value)
  }

  function onOrgSizeChange(value: any) {
    setOrgSize(value)
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
      kind: orgKind,
      ...(orgKind == 'COMPANY' ? { size: orgSize } : {}),
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
    <Panel
      hideHeaderStyling
      title={
        <div key="panel-title">
          <h4>Create a new organization</h4>
        </div>
      }
      footer={
        <div key="panel-footer" className="flex w-full items-center justify-between">
          <Button type="default" onClick={() => router.push('/projects')}>
            Cancel
          </Button>
          <div className="flex items-center space-x-3">
            <p className="text-xs text-scale-900">You can rename your organization later</p>
            <Button onClick={onClickSubmit} loading={newOrgLoading} disabled={newOrgLoading}>
              Create organization
            </Button>
          </div>
        </div>
      }
    >
      <Panel.Content className="pt-0">
        <p className="text-sm">This is your organization within Supabase.</p>
        <p className="text-sm text-scale-1100">
          For example, you can use the name of your company or department.
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
      <Panel.Content className="Form section-block--body has-inputs-centered">
        <Listbox
          label="Type of organization"
          layout="horizontal"
          value={orgKind}
          onChange={onOrgKindChange}
          descriptionText="What would best describe your organization?"
        >
          {Object.entries(ORG_KIND_TYPES).map(([k, v]) => {
            return (
              <Listbox.Option key={k} label={v} value={k}>
                {v}
              </Listbox.Option>
            )
          })}
        </Listbox>
      </Panel.Content>
      {orgKind == 'COMPANY' ? (
        <Panel.Content className="Form section-block--body has-inputs-centered">
          <Listbox
            label="Company size"
            layout="horizontal"
            value={orgSize}
            onChange={onOrgSizeChange}
            descriptionText="How many people are in your company?"
          >
            {Object.entries(ORG_SIZE_TYPES).map(([k, v]) => {
              return (
                <Listbox.Option key={k} label={v} value={k}>
                  {v}
                </Listbox.Option>
              )
            })}
          </Listbox>
        </Panel.Content>
      ) : (
        <></>
      )}
    </Panel>
  )
}

Wizard.getLayout = (page) => (
  <WizardLayout organization={null} project={null}>
    {page}
  </WizardLayout>
)

export default observer(Wizard)
