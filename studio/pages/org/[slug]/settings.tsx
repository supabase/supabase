import Image from 'next/image'
import { createContext, useEffect, useContext, useState } from 'react'
import { useRouter } from 'next/router'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { toJS } from 'mobx'
import { pluckJsonSchemaFields, pluckObjectFields } from 'lib/helpers'
import { AutoField } from 'uniforms-bootstrap4'
import { organizations } from 'stores/jsonSchema'
import {
  Loading,
  Button,
  Badge,
  Tabs,
  Typography,
  Alert,
  Input,
  IconSearch,
  IconUser,
} from '@supabase/ui'

import { useOrganizationDetail, useStore, withAuth } from 'hooks'
import { NextPageWithLayout, Project } from 'types'
import { API_URL } from 'lib/constants'
import { post, patch } from 'lib/common/fetch'

import Panel from 'components/ui/Panel'
import { AccountLayoutWithoutAuth } from 'components/layouts'
import {
  BillingSettings,
  InvoicesSettings,
  OwnerDropdown,
  InviteMemberModal,
  DeleteOrganizationButton,
} from 'components/interfaces/Organization'

import Table from 'components/to-be-cleaned/Table'
import SchemaFormPanel from 'components/to-be-cleaned/forms/SchemaFormPanel'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'
import { isInviteExpired } from 'components/interfaces/Organization/Organization.utils'

// [Joshen] Low prio refactor: Bring out general and team settings into their own components too

export const PageContext = createContext(null)

const OrgSettingsLayout = withAuth(
  observer(({ children }) => {
    const { app, ui } = useStore()
    const router = useRouter()
    const PageState: any = useLocalObservable(() => ({
      user: {} as any,
      organization: {},
      projects: [],
      members: [],
      products: [],
      membersFilterString: '',
      get isOrgOwner() {
        return (
          this.members.find((x: any) => x.profile.id === this.user?.id && x.is_owner) != undefined
        )
      },
      get filteredMembers() {
        const temp = this.members.filter((x: any) => {
          let profile = x.profile
          if (profile) {
            return (
              profile.username.includes(this.membersFilterString) ||
              profile.primary_email.includes(this.membersFilterString)
            )
          }
          if (x.invited_email) {
            return x.invited_email.includes(this.membersFilterString)
          }
        })
        return temp.sort((a: any, b: any) => a.profile.username.localeCompare(b.profile.username))
      },
      initData(organization: any, user: any, projects: any) {
        this.organization = organization
        this.user = user
        this.projects = projects
      },
      onOrgUpdated(updatedOrg: any) {
        app.onOrgUpdated(updatedOrg)
      },
      onOrgDeleted() {
        app.onOrgDeleted(this.organization)
      },
    }))

    useEffect(() => {
      // User added a new payment method
      if (router.query.setup_intent && router.query.redirect_status) {
        ui.setNotification({
          category: 'success',
          message: 'Successfully added new payment method',
        })
      }
    }, [])

    useEffect(() => {
      const organization = ui.selectedOrganization
      const user = ui.profile
      const projects = app.projects.list((x: Project) => x.organization_id == organization?.id)
      PageState.initData(organization, user, projects)
    }, [ui.selectedOrganization, ui.profile])

    return (
      <AccountLayoutWithoutAuth
        title={PageState.organization?.name || 'Supabase'}
        breadcrumbs={[
          {
            key: `org-settings`,
            label: 'Settings',
          },
        ]}
      >
        <PageContext.Provider value={PageState}>{children}</PageContext.Provider>
      </AccountLayoutWithoutAuth>
    )
  })
)

const OrgSettings: NextPageWithLayout = () => {
  const { ui } = useStore()

  return <>{ui.selectedOrganization && <OrganizationSettings />}</>
}

OrgSettings.getLayout = (page) => <OrgSettingsLayout>{page}</OrgSettingsLayout>

export default observer(OrgSettings)

const OrganizationSettings = observer(() => {
  const PageState: any = useContext(PageContext)
  const { ui } = useStore()

  const {
    members,
    products,
    isError: isOrgDetailError,
  } = useOrganizationDetail(ui.selectedOrganization?.slug || '')

  useEffect(() => {
    if (!isOrgDetailError) {
      PageState.members = members ?? []
      PageState.products = products ?? []
    }
  }, [members, products, isOrgDetailError])

  if (!PageState.organization) return <div />

  return (
    <div className="p-4 pt-0">
      <TabsView />
    </div>
  )
})

const TabsView = observer(() => {
  const { ui, app } = useStore()
  const [selectedTab, setSelectedTab] = useState('GENERAL')

  const organization = ui.selectedOrganization
  const projects = app.projects.list((x: Project) => x.organization_id == organization?.id)

  return (
    <>
      <div className="space-y-3">
        <section className="mt-4">
          <h1 className="text-3xl">{organization?.name || 'Organization'} settings</h1>
        </section>
        <nav className="">
          <Tabs onChange={(id: any) => setSelectedTab(id)} type="underlined">
            <Tabs.Panel id="GENERAL" label="General" />
            <Tabs.Panel id="TEAM" label="Team" />
            <Tabs.Panel id="BILLING" label="Billing" />
            <Tabs.Panel id="INVOICES" label="Invoices" />
          </Tabs>
        </nav>
      </div>

      <div className="mb-8">
        {selectedTab == 'GENERAL' ? (
          <GeneralSettings />
        ) : selectedTab == 'TEAM' ? (
          <TeamSettings />
        ) : selectedTab == 'BILLING' ? (
          <BillingSettings organization={organization} projects={projects} />
        ) : selectedTab == 'INVOICES' ? (
          <InvoicesSettings organization={organization} />
        ) : null}
      </div>
    </>
  )
})

const GeneralSettings = observer(() => {
  const PageState: any = useContext(PageContext)
  const { ui } = useStore()

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
      ui.setNotification({ category: 'success', message: 'Successfully saved settings' })
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
        />
        <AutoField
          name="billing_email"
          showInlineError
          errorMessage="Please enter an email address"
        />
      </SchemaFormPanel>

      <OrgDeletePanel />
    </article>
  )
})

const OrgDeletePanel = observer(() => {
  const PageState: any = useContext(PageContext)

  if (!PageState.isOrgOwner) return null
  return (
    <Panel
      title={
        <Typography.Text key="panel-title" className="uppercase">
          Danger Zone
        </Typography.Text>
      }
    >
      <Panel.Content>
        <Alert
          variant="danger"
          withIcon
          // @ts-ignore
          title={
            <h5 className="text-red-900">
              Deleting this organization will also remove its projects
            </h5>
          }
        >
          <p className="text-red-900">
            Make sure you have made a backup if you want to keep your data
          </p>
          <DeleteOrganizationButton />
        </Alert>
      </Panel.Content>
    </Panel>
  )
})

const TeamSettings = observer(() => {
  const PageState: any = useContext(PageContext)
  const { ui } = useStore()
  const [isLeaving, setIsLeaving] = useState(false)

  const orgSlug = PageState.organization.slug

  const leaveTeam = async () => {
    setIsLeaving(true)
    try {
      confirmAlert({
        title: 'Are you sure?',
        message: 'Are you sure you want to leave this team? This is permanent.',
        onAsyncConfirm: async () => {
          const response = await post(`${API_URL}/organizations/${orgSlug}/members/leave`, {})
          if (response.error) {
            throw response.error
          } else {
            window?.location.replace('/') // Force reload to clear Store
          }
        },
      })
    } catch (error: any) {
      ui.setNotification({ category: 'error', message: `Error leaving: ${error?.message}` })
    } finally {
      setIsLeaving(false)
    }
  }

  return (
    <>
      <div className="container my-4 max-w-4xl space-y-8">
        <div className="flex justify-between">
          <MembersFilterInput />
          {PageState.isOrgOwner ? (
            <div>
              <InviteMemberModal
                organization={PageState.organization}
                members={PageState.members}
                user={PageState.user}
              />
            </div>
          ) : (
            <div>
              <Button type="default" onClick={() => leaveTeam()} loading={isLeaving}>
                Leave team
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="container my-4 max-w-4xl space-y-8">
        <MembersView />
      </div>
    </>
  )
})

const MembersFilterInput = observer(() => {
  const PageState: any = useContext(PageContext)

  function onFilterMemberChange(e: any) {
    PageState.membersFilterString = e.target.value
  }

  return (
    <Input
      icon={<IconSearch size="tiny" />}
      size="small"
      value={PageState.membersFilterString}
      onChange={onFilterMemberChange}
      name="email"
      id="email"
      placeholder="Filter members"
    />
  )
})

const MembersView = observer(() => {
  const PageState: any = useContext(PageContext)

  return (
    <div className="rounded">
      <Loading active={!PageState.filteredMembers}>
        <Table
          head={[
            <Table.th key="header-user">User</Table.th>,
            <Table.th key="header-status"></Table.th>,
            <Table.th key="header-role">Role</Table.th>,
            <Table.th key="header-action"></Table.th>,
          ]}
          body={[
            PageState.filteredMembers.map((x: any) => (
              <Table.tr key={x.id}>
                <Table.td>
                  <div className="flex items-center space-x-4">
                    <div>
                      {x.invited_id ? (
                        <span className="border-border-secondary-light dark:border-border-secondary-dark flex rounded-full border-2 p-2">
                          <IconUser size={18} strokeWidth={2} />
                        </span>
                      ) : (
                        <Image
                          src={`https://github.com/${x.profile?.username}.png?size=80`}
                          width="40"
                          height="40"
                          className="border-border-secondary-light dark:border-border-secondary-dark rounded-full border"
                        />
                      )}
                    </div>
                    <div>
                      {x.profile?.username && !x.invited_id && (
                        <>
                          <Typography.Text>{x.profile?.username}</Typography.Text>
                          <br />
                        </>
                      )}
                      <Typography.Text type="secondary">
                        {x.profile ? x.profile.primary_email : ''}
                      </Typography.Text>
                    </div>
                  </div>
                </Table.td>

                <Table.td>
                  {x.invited_id && (
                    <Badge color={isInviteExpired(x.invited_at) ? 'yellow' : 'red'}>
                      {isInviteExpired(x.invited_at) ? 'Invited' : 'Expired'}
                    </Badge>
                  )}
                </Table.td>

                <Table.td>
                  <Typography.Text type="secondary">
                    {x.is_owner ? 'Owner' : 'Developer'}
                  </Typography.Text>
                </Table.td>
                <Table.td>
                  {PageState.isOrgOwner && !x.is_owner && (
                    // @ts-ignore
                    <OwnerDropdown members={PageState.members} member={x} />
                  )}
                </Table.td>
              </Table.tr>
            )),
            <Table.tr
              key="footer"
              // @ts-ignore
              colSpan="3"
              className="bg-panel-secondary-light dark:bg-panel-secondary-dark"
            >
              {/* @ts-ignore */}
              <Table.td colSpan="4">
                <Typography.Text type="secondary">
                  {PageState.membersFilterString ? `${PageState.filteredMembers.length} of ` : ''}
                  {PageState.members.length || '0'}{' '}
                  {PageState.members.length == 1 ? 'user' : 'users'}
                </Typography.Text>
              </Table.td>
            </Table.tr>,
          ]}
        />
      </Loading>
    </div>
  )
})
