import { FC, createContext, useEffect, useContext, useState } from 'react'
import { useRouter } from 'next/router'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { Transition } from '@headlessui/react'
import { Button, Typography } from '@supabase/ui'
import { runInAction } from 'mobx'

import { API_URL } from 'lib/constants'
import { post } from 'lib/common/fetch'
import { clickOutsideListener, useStore } from 'hooks'
import VercelIntegrationLayout from 'components/layouts/VercelIntegrationLayout'

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

  const { app } = useStore()

  useEffect(() => {
    PageState.loadInitialData()

    const sortedOrganizations = app.organizations.list()
    PageState.shouldShowOrgCreationUI = sortedOrganizations?.length == 0
  }, [])

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
  const sortedOrganizations = app.organizations.list()

  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(false)

  async function onClick() {
    setLoading(true)
    const response = await post(`${API_URL}/organizations/new`, {
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
      {sortedOrganizations?.length > 0 ? (
        <Typography.Title level={3}>Create a new organization</Typography.Title>
      ) : (
        <>
          <Typography.Title level={3}>You do not have an organization</Typography.Title>
          <Typography.Text>You will need an organization to deploy this project</Typography.Text>
        </>
      )}

      <div className="py-4">
        <label htmlFor="orgName" className="block w-full text-base normal-case">
          Organization name
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="orgName"
            id="orgName"
            value={orgName}
            onChange={onOrgNameChange}
            placeholder="My organization"
            className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md"
          />
        </div>
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

  const { app } = useStore()
  const sortedOrganizations = app.organizations.list()

  const clickContainerRef = clickOutsideListener(() => {
    if (PageState.selectMenuOpened) PageState.toggleSelectMenu(!PageState.selectMenuOpened)
  })

  function onOpenMenu() {
    runInAction(() => {
      PageState.toggleSelectMenu(true)
    })
  }

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

  return (
    <div className="">
      <label id="listbox-label" className="block w-full text-base normal-case">
        Choose an organization
      </label>
      <div ref={clickContainerRef} className="mt-1 mb-8 relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded="true"
          aria-labelledby="listbox-label"
          className="bg-white relative w-full border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
          onClick={onOpenMenu}
        >
          <span className="block truncate text-gray-700">{PageState.selectedOrg?.name || '-'}</span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </button>
        <Transition
          show={PageState.selectMenuOpened}
          enter=""
          enterFrom=""
          enterTo=""
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
            <ul
              tabIndex={-1}
              role="listbox"
              aria-labelledby="listbox-label"
              className="rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm"
              style={{ maxHeight: '15rem' }}
            >
              {sortedOrganizations?.map((x) => (
                <OrgMenuItem key={x.id} org={x} />
              ))}
            </ul>
          </div>
        </Transition>
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

const OrgMenuItem: FC<any> = observer(({ org }) => {
  const PageState: any = useContext(PageContext)
  const selected = PageState.selectedOrg?.slug == org.slug
  const [highlighted, setHighlighted] = useState(false)

  function onMouseEnter() {
    setHighlighted(true)
  }

  function onMouseOver() {
    if (!highlighted) setHighlighted(true)
  }

  function onMouseLeave() {
    setHighlighted(false)
  }

  function onSelect() {
    PageState.selectedOrg = org
    PageState.selectMenuOpened = false
  }

  return (
    <li
      id="listbox-option-0"
      role="option"
      className={`${
        highlighted ? 'bg-green-500' : ''
      } cursor-default select-none relative py-2 pl-3 pr-9`}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      onMouseOver={onMouseOver}
      onMouseLeave={onMouseLeave}
    >
      <span
        className={`${selected ? 'font-semibold' : 'font-normal'} ${
          highlighted ? 'text-white' : 'text-gray-700'
        } block truncate `}
      >
        {org.name}
      </span>

      {selected && (
        <span
          className={`${
            highlighted ? 'text-white' : 'text-green-500'
          } absolute inset-y-0 right-0 flex items-center pr-4`}
        >
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}
    </li>
  )
})
