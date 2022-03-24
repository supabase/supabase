import { createContext, useEffect, useContext, useState } from 'react'
import { useRouter } from 'next/router'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { toJS } from 'mobx'
import { pluckJsonSchemaFields, pluckObjectFields, timeout } from 'lib/helpers'
import { AutoField } from 'uniforms-bootstrap4'
import { organizations } from 'stores/jsonSchema'
import {
  Loading,
  Button,
  IconMoreHorizontal,
  Tabs,
  Typography,
  IconTrash,
  Alert,
  Input,
  Dropdown,
  Modal,
  IconSearch,
  Form,
} from '@supabase/ui'

import { API_URL } from 'lib/constants'
import { useOrganizationDetail, useStore, withAuth } from 'hooks'
import { post, delete_ } from 'lib/common/fetch'
import { AccountLayout } from 'components/layouts'
import { BillingSettings, InvoicesSettings } from 'components/interfaces/Organization'

import Table from 'components/to-be-cleaned/Table'
import Panel from 'components/to-be-cleaned/Panel'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'
import InviteMemberModal from 'components/to-be-cleaned/ModalsDeprecated/InviteMemberModal'
import TextConfirmModal from 'components/to-be-cleaned/ModalsDeprecated/TextConfirmModal'
import SchemaFormPanel from 'components/to-be-cleaned/forms/SchemaFormPanel'
import { Project } from 'types'

// [Joshen] Low prio refactor: Bring out general and team settings into their own components too

const PageContext = createContext(null)

const OrgSettings = () => {
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
        return (
          profile.username.includes(this.membersFilterString) ||
          profile.primary_email.includes(this.membersFilterString)
        )
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
      ui.setNotification({ category: 'success', message: 'Successfully added new payment method' })
    }
  }, [])

  useEffect(() => {
    const organization = ui.selectedOrganization
    const user = ui.profile
    const projects = app.projects.list((x: Project) => x.organization_id == organization?.id)
    PageState.initData(organization, user, projects)
  }, [ui.selectedOrganization, ui.profile])

  return (
    <PageContext.Provider value={PageState}>
      <PageLayout />
    </PageContext.Provider>
  )
}
export default withAuth(observer(OrgSettings))

const PageLayout = observer(() => {
  const { ui } = useStore()
  const PageState: any = useContext(PageContext)

  return (
    <AccountLayout
      title={PageState.organization?.name || 'Supabase'}
      // @ts-ignore
      breadcrumbs={[
        {
          key: `org-settings`,
          label: 'Settings',
        },
      ]}
    >
      {ui.selectedOrganization && <OrganizationSettings />}
    </AccountLayout>
  )
})

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
            {/* @ts-ignore */}
            <Tabs.Panel id="GENERAL" label="General">
              <></>
            </Tabs.Panel>
            {/* @ts-ignore */}
            <Tabs.Panel id="TEAM" label="Team">
              <></>
            </Tabs.Panel>
            {/* @ts-ignore */}
            <Tabs.Panel id="BILLING" label="Billing">
              <></>
            </Tabs.Panel>
            {/* @ts-ignore */}
            <Tabs.Panel id="INVOICES" label="Invoices">
              <></>
            </Tabs.Panel>
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
    const response = await post(
      `${API_URL}/organizations/${PageState.organization.slug}/update`,
      model
    )
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
    <article className="my-4 container max-w-4xl space-y-8">
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
      title={[
        <Typography.Text key="panel-title" className="uppercase">
          Danger Zone
        </Typography.Text>,
      ]}
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
          <OrgDeleteModal />
        </Alert>
      </Panel.Content>
    </Panel>
  )
})

const OrgDeleteModal = observer(() => {
  const PageState: any = useContext(PageContext)
  const router = useRouter()
  const { ui } = useStore()

  const { slug: orgSlug, name: orgName } = PageState.organization

  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState('')

  function toggle() {
    setIsOpen(!isOpen)
  }

  return (
    <>
      <div className="mt-2">
        <Button onClick={toggle} type="danger">
          Delete organization
        </Button>
      </div>
      <Modal
        visible={isOpen}
        onCancel={toggle}
        header={
          <div className="flex gap-2 items-baseline">
            <h5 className="text-sm text-scale-1200">Delete organisation</h5>
            <span className="text-xs text-scale-900">Are you sure?</span>
          </div>
        }
        size="small"
        hideFooter
        closable
      >
        <Form
          initialValues={{
            orgName: '',
          }}
          validateOnBlur
          onSubmit={async (values: any, { setSubmitting }: any) => {
            setSubmitting(true)
            const response = await delete_(`${API_URL}/organizations/${orgSlug}/remove`)
            if (response.error) {
              ui.setNotification({
                category: 'error',
                message: `Failed to delete organization: ${response.error.message}`,
              })
              setSubmitting(false)
            } else {
              PageState.onOrgDeleted(PageState.organization)
              setSubmitting(false)
              router.push('/')
            }
          }}
          validate={(values) => {
            const errors: any = {}
            if (!values.orgName) {
              errors.orgName = 'Enter the name of the organization.'
            }
            if (values.orgName !== orgSlug) {
              errors.orgName = 'Value entered does not match name of the organization.'
            }
            return errors
          }}
        >
          {({ isSubmitting }: { isSubmitting: boolean }) => (
            <div className="space-y-4 py-3">
              <Modal.Content>
                <p className="text-scale-900 text-sm">
                  This action <span className="text-scale-1200">cannot</span> be undone. This will
                  permanently delete the <span className="text-scale-1200">{orgName}</span>{' '}
                  organization and remove all of its projects.
                </p>
              </Modal.Content>
              <Modal.Seperator />
              <Modal.Content>
                <Input
                  id="orgName"
                  label={
                    <span>
                      Please type <Typography.Text strong>{orgSlug}</Typography.Text> to confirm
                    </span>
                  }
                  onChange={(e) => setValue(e.target.value)}
                  value={value}
                  placeholder="Type in the orgnaization name"
                  className="w-full"
                />
              </Modal.Content>
              <Modal.Seperator />
              <Modal.Content>
                <Button
                  type="danger"
                  htmlType="submit"
                  loading={isSubmitting}
                  size="small"
                  block
                  danger
                >
                  I understand, delete this organization
                </Button>
              </Modal.Content>
            </div>
          )}
        </Form>
      </Modal>
    </>
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
      <div className="my-4 container max-w-4xl space-y-8">
        <div className="flex justify-between">
          <MembersFilterInput />
          {PageState.isOrgOwner ? (
            <div>
              <InviteMemberModal
                organization={PageState.organization}
                members={PageState.members}
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
      <div className="my-4 container max-w-4xl space-y-8">
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
            <Table.th key="header-role">Role</Table.th>,
            <Table.th key="header-action"></Table.th>,
          ]}
          body={[
            PageState.filteredMembers.map((x: any) => (
              <Table.tr key={x.id}>
                <Table.td>
                  <div className="flex items-center space-x-4">
                    <div>
                      <img
                        src={`https://github.com/${x.profile.username}.png?size=80`}
                        width="40"
                        className="rounded-full border border-border-secondary-light dark:border-border-secondary-dark"
                      />
                    </div>
                    <div>
                      <Typography.Text>{x.profile.username}</Typography.Text>
                      <br />
                      <Typography.Text type="secondary">{x.profile.primary_email}</Typography.Text>
                    </div>
                  </div>
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
              <Table.td colSpan="3">
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

const OwnerDropdown = observer(({ members, member }: any) => {
  const PageState: any = useContext(PageContext)
  const { ui } = useStore()
  const { mutateOrgMembers } = useOrganizationDetail(ui.selectedOrganization?.slug || '')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // handle modal visibility
  const [ownerTransferIsVisble, setOwnerTransferIsVisble] = useState(false)

  const { id: orgId, slug: orgSlug, stripe_customer_id, name: orgName } = PageState.organization

  function toggleDropDown() {
    setIsOpen(!isOpen)
  }

  async function handleMemberDelete() {
    setIsOpen(false)
    await timeout(200)

    confirmAlert({
      title: 'Confirm to remove',
      message: `This is permanent! Are you sure you want to remove ${member.profile.username} ?`,
      onAsyncConfirm: async () => {
        setLoading(true)
        const response = await delete_(`${API_URL}/organizations/${orgSlug}/members/remove`, {
          member_id: member.id,
        })
        if (response.error) {
          ui.setNotification({
            category: 'error',
            message: `Failed to delete user: ${response.error.message}`,
          })
          setLoading(false)
        } else {
          const updatedMembers = members.filter((x: any) => x.id !== member.id)
          mutateOrgMembers(updatedMembers)
          ui.setNotification({ category: 'success', message: 'Successfully removed member' })
        }
      },
    })
  }

  async function handleTransfer() {
    setLoading(true)

    const response = await post(`${API_URL}/organizations/${orgSlug}/transfer`, {
      org_id: orgId,
      member_id: member.id,
      stripe_customer_id,
    })
    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to transfer ownership: ${response.error.message}`,
      })
      setLoading(false)
    } else {
      const updatedMembers = [...members]
      const oldOwner = updatedMembers.find((x) => x.is_owner == true)
      if (oldOwner) oldOwner.is_owner = false
      const newOwner = updatedMembers.find((x) => x.id == member.id)
      if (newOwner) newOwner.is_owner = true
      mutateOrgMembers(updatedMembers)
      setOwnerTransferIsVisble(false)
      ui.setNotification({ category: 'success', message: 'Successfully transfered organization' })
    }
  }

  return (
    <div className="flex items-center justify-end">
      <Dropdown
        side="bottom"
        align="end"
        overlay={
          <>
            <Dropdown.Item onClick={() => setOwnerTransferIsVisble(!ownerTransferIsVisble)}>
              <div className="flex flex-col">
                <p>Make owner</p>
                <p className="opacity-50 block">Transfer ownership of "{orgName}"</p>
              </div>
            </Dropdown.Item>
            <Dropdown.Seperator />
            <Dropdown.Item icon={<IconTrash size="tiny" />} onClick={handleMemberDelete}>
              Remove member
            </Dropdown.Item>
          </>
        }
      >
        <Button
          as="span"
          disabled={loading}
          loading={loading}
          type="text"
          icon={<IconMoreHorizontal />}
        ></Button>
      </Dropdown>

      <TextConfirmModal
        title="Transfer organization"
        visible={ownerTransferIsVisble}
        confirmString={orgSlug}
        loading={loading}
        confirmLabel="I understand, transfer ownership"
        confirmPlaceholder="Type in name of orgnization"
        onCancel={() => setOwnerTransferIsVisble(!ownerTransferIsVisble)}
        onConfirm={handleTransfer}
        alert="Payment methods such as credit cards will also be transferred. You may want to delete credit card information first before transferring."
        text={
          <span>
            By transferring this organization, it will be solely owned by{' '}
            <span className="dark:text-white font-medium">{member.profile.username}</span>, they
            will also be able to remove you from the organization as a member
          </span>
        }
      />
    </div>
  )
})
