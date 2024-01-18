import { runInAction } from 'mobx'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { ChangeEvent, createContext, useContext, useEffect, useState } from 'react'
import { Button, Input, Select } from 'ui'

import VercelIntegrationLayout from 'components/layouts/VercelIntegrationLayout'
import { useOrganizationCreateMutation } from 'data/organizations/organization-create-mutation'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'

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
  const router = useRouter()
  const PageState: any = useContext(PageContext)
  const { data: organizations } = useOrganizationsQuery()

  const [orgName, setOrgName] = useState('')

  const { mutate: createOrganization, isLoading: isCreating } = useOrganizationCreateMutation({
    onSuccess: (org) => {
      PageState.selectedOrg = org
      const query = new URLSearchParams(PageState.queryParams).toString()
      router.push(`/vercel/setupProject?${query}`)
    },
  })

  return (
    <div>
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
          onChange={(e: any) => setOrgName(e.target.value)}
        />
      </div>
      <Button
        disabled={isCreating || orgName === ''}
        loading={isCreating}
        onClick={() => createOrganization({ name: orgName, tier: 'tier_free' })}
      >
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
    <div>
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
