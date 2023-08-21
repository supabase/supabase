import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Button, Input, Listbox } from 'ui'

import { WizardLayout } from 'components/layouts'
import Panel from 'components/ui/Panel'
import { useOrganizationCreateMutation } from 'data/organizations/organization-create-mutation'
import { useStore } from 'hooks'
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
  const { ui } = useStore()
  const router = useRouter()

  const [orgName, setOrgName] = useState('')
  const [orgKind, setOrgKind] = useState(ORG_KIND_DEFAULT)
  const [orgSize, setOrgSize] = useState(ORG_SIZE_DEFAULT)

  const { mutate: createOrganization, isLoading: newOrgLoading } = useOrganizationCreateMutation({
    onSuccess: async (org: any) => {
      // [Joshen] API spec is wrong? its returning org type as only having id and name
      router.push(`/new/${org.slug}`)
    },
  })

  function validateOrgName(name: any) {
    return name.length >= 1
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
    const trimmedOrgName = orgName ? orgName.trim() : ''
    const isOrgNameValid = validateOrgName(trimmedOrgName)
    if (!isOrgNameValid) {
      return ui.setNotification({ category: 'error', message: 'Organization name is empty' })
    }

    createOrganization({
      name: trimmedOrgName,
      kind: orgKind,
      ...(orgKind == 'COMPANY' ? { size: orgSize } : {}),
    })
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
