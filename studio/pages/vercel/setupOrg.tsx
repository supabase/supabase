import { runInAction } from 'mobx'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { ChangeEvent, createContext, useContext, useEffect, useState } from 'react'

import VercelIntegrationLayout from 'components/layouts/VercelIntegrationLayout'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { Button, Input, Select } from 'ui'

const PageContext = createContext(null)
function SetupOrg() {
  const PageState = useLocalObservable(() => ({
    token: '',
    teamId: '',
    externalId: '',
    configurationId: '',
    next: '',
    selectedOrg: undefined,
    vercelProjectId: undefined,
    selectMenuOpened: false,
    shouldShowOrgCreationUI: false,
    get queryParams() {
      return {
        token: this.token,
        teamId: this.teamId,
        'external-id': this.externalId,
        configurationId: this.configurationId,
        // @ts-ignore
        supabaseOrgId: this.selectedOrg.id,
        vercelProjectId: this.vercelProjectId,
        next: this.next,
      }
    },
    get canContinue() {
      return !!this.selectedOrg
    },
    loadInitialData() {
      this.getQueryParams()
    },
    getQueryParams() {
      const params = new URLSearchParams(window.location.search)
      this.configurationId = params.get('configurationId') as string
      this.vercelProjectId = params.get('vercelProjectId') as any
      this.next = params.get('next') as string
      this.externalId = params.get('external-id') as string
      this.token = params.get('token') as string
      this.teamId = params.get('teamId') as string
    },
    toggleSelectMenu(value: any) {
      this.selectMenuOpened = value
    },
  }))

  const { data: organizations } = useOrganizationsQuery()

  useEffect(() => {
    PageState.loadInitialData()

    PageState.shouldShowOrgCreationUI = organizations?.length == 0
  }, [organizations])

  return (
    // @ts-ignore
    <PageContext.Provider value={PageState}>
      <VercelIntegrationLayout>
        {PageState.shouldShowOrgCreationUI ? <CreateOrganization /> : <OrgSelection />}
      </VercelIntegrationLayout>
    </PageContext.Provider>
  )
}
export default observer(SetupOrg)

const CreateOrganization = observer(({}) => {
  const PageState: any = useContext(PageContext)
  const router = useRouter()

  const { ui, app } = useStore()
  const { data: organizations } = useOrganizationsQuery()

  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(false)

  async function onClick() {
    setLoading(true)
    const response = await post(`${API_URL}/organizations`, {
      name: orgName,
    })
    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to set up organization: ${response.error.message}`,
      })
      setLoading(false)
    } else {
      const org = response
      PageState.selectedOrg = org

      const query = new URLSearchParams(PageState.queryParams).toString()
      router.push(`/vercel/setupProject?${query}`)
    }
  }

  function onOrgNameChange(e: any) {
    setOrgName(e.target.value)
  }

  return (
    <div className="">
      {(organizations?.length ?? 0) > 0 ? (
        <p className="mb-2">Create a new organization</p>
      ) : (
        <>
          <p className="mb-2">You do not have any organization</p>
          <p>You will need an organization to deploy this project</p>
        </>
      )}

      <div className="py-4">
        <Input
          autoFocus
          label="Name"
          type="text"
          placeholder="Organization name"
          descriptionText="What's the name of your company or team?"
          value={orgName}
          onChange={onOrgNameChange}
        />
      </div>
      <Button disabled={loading || orgName == ''} loading={loading} onClick={onClick}>
        Create organization
      </Button>
    </div>
  )
})

const OrgSelection = observer(({}) => {
  const PageState: any = useContext(PageContext)
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { data: organizations } = useOrganizationsQuery()

  useEffect(() => {
    if (!PageState.selectedOrg) {
      PageState.selectedOrg = (organizations?.length ?? 0) > 0 ? organizations?.[0] : undefined
    }
  }, [organizations])

  function onContinue() {
    setLoading(true)

    const query = new URLSearchParams(PageState.queryParams).toString()
    router.push(`/vercel/setupProject?${query}`)
  }

  function onNewOrg() {
    runInAction(() => {
      PageState.shouldShowOrgCreationUI = true
    })
  }

  function onOrgSelect(e: ChangeEvent<HTMLSelectElement>) {
    const selectedOrg = organizations?.find((x: any) => x.slug === e.target.value)
    PageState.selectedOrg = selectedOrg
  }

  return (
    <div className="">
      <div className="relative mt-1 mb-8">
        <Select
          label="Choose an organization"
          value={PageState.selectedOrg?.slug}
          onChange={onOrgSelect}
        >
          {organizations?.map((x) => {
            return (
              <Select.Option key={x.id} value={x.slug}>
                {x.name}
              </Select.Option>
            )
          })}
        </Select>
      </div>
      <div className="flex flex-col space-y-4">
        <Button
          disabled={loading || !PageState.canContinue}
          loading={loading}
          onClick={onContinue}
          block
        >
          Continue
        </Button>
        <Button type="secondary" onClick={onNewOrg} block>
          New Organization
        </Button>
      </div>
    </div>
  )
})
