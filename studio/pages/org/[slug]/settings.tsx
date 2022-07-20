import {
  Alert,
  Badge,
  Button,
  Dropdown,
  Form,
  IconMoreHorizontal,
  IconSearch,
  IconTrash,
  Input,
  Loading,
  Modal,
  Tabs,
  Typography,
  IconUser,
  Listbox,
} from '@supabase/ui'
import { pluckJsonSchemaFields, pluckObjectFields, timeout } from 'lib/helpers'
import { toJS } from 'mobx'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { createContext, useContext, useEffect, useState } from 'react'
import { organizations } from 'stores/jsonSchema'
import { AutoField } from 'uniforms-bootstrap4'

import { BillingSettings, InvoicesSettings } from 'components/interfaces/Organization'
import { AccountLayoutWithoutAuth } from 'components/layouts'
import { useOrganizationDetail, usePermissions, useStore, withAuth } from 'hooks'
import { delete_, get, patch, post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import InviteMemberModal from 'components/interfaces/Organization/InviteMemberModal'
import SchemaFormPanel from 'components/to-be-cleaned/forms/SchemaFormPanel'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'
import Table from 'components/to-be-cleaned/Table'
import TextConfirmModal from 'components/ui/Modals/TextConfirmModal'
import Panel from 'components/ui/Panel'
import useSWR from 'swr'
import { Member, NextPageWithLayout, Project, User } from 'types'
import Image from 'next/image'

// [Joshen] Low prio refactor: Bring out general and team settings into their own components too

export const PageContext = createContext(null)

const OrgSettingsLayout = withAuth(
  observer(({ children }) => {
    const { app, ui } = useStore()
    const router = useRouter()

    console.log('ui.permissions', ui.permissions)

    const PageState: any = useLocalObservable(() => ({
      user: {} as any,
      organization: {},
      projects: [],
      members: [],
      roles: [] as any,
      membersFilterString: '',
      get isOrgOwner() {
        return true
        // to do : need logic in here to check the role of the user

        // console.log(this.members[0])
        // console.log(this.user.id)
        // return (
        //   this.members.find((x: Member) => {
        //     // console.log('member', x)
        //     return (
        //       x.role_ids &&
        //       x.role_ids.find((x: number) => {
        //         console.log(x)
        //         const roleId = x
        //         return this.roles.find((x: any) => {
        //           x.name === 'Owner' && roleId === x.id
        //         })
        //       })
        //     ) // sx.id === this.user?.id // && x.is_owner
        //   }) != undefined
        // )
        // usePermissions(PermissionAction)
      },
      get filteredMembers() {
        // console.log('this.members', this.members)
        const temp = this.members.filter((x: any) => {
          if (x.invited_at) {
            return x.primary_email.includes(this.membersFilterString)
          }
          if (x.gotrue_id) {
            return (
              x.username.includes(this.membersFilterString) ||
              x.primary_email.includes(this.membersFilterString)
            )
          }
        })
        // console.log('temp', temp)
        return temp.sort((a: any, b: any) => a.username.localeCompare(b.username))
      },
      initData(organization: any, user: any, projects: any, roles: any) {
        this.organization = organization
        this.user = user
        this.projects = projects
        this.roles = roles
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

      const roles = async () => {
        try {
          const { data: roles, error: rolesError } = useSWR(
            `${API_URL}/organizations/${PageState.organization.slug}/roles`,
            get
          )
          if (rolesError) throw rolesError
          return roles
        } catch (error) {
          console.log(error)
        }
      }

      PageState.initData(organization, user, projects, roles)
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
    // products,
    isError: isOrgDetailError,
  } = useOrganizationDetail(ui.selectedOrganization?.slug || '')

  useEffect(() => {
    if (!isOrgDetailError) {
      PageState.members = members ?? []
    }
  }, [members, isOrgDetailError])

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
  const canUpdateOrganization = usePermissions(
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
      ui.setNotification({
        category: 'error',
        message: `Error leaving: ${error?.message}`,
      })
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
  const { ui } = useStore()
  const { mutateOrgMembers } = useOrganizationDetail(ui.selectedOrganization?.slug || '')

  // handling visibility of role change modal
  const [userRoleChangeModalVisible, setUserRoleChangeModalVisible] = useState(false)
  // handling the user details of a user who is being changed
  interface SelectedUserProps extends User {
    oldRoleId: number
    newRoleId: number
  }
  const [selectedUser, setSelectedUser] = useState<SelectedUserProps>()
  // loading state of role change fetch request
  const [loading, setLoading] = useState(false)
  // fetch roles available for this org
  const { data: roles, error: rolesError } = useSWR(
    `${API_URL}/organizations/${PageState.organization.slug}/roles`,
    get
  )

  async function handleRoleChange(
    checked: boolean,
    roleId: number,
    gotrueId: number,
    member: Member
  ) {
    setLoading(true)
    const response = await (checked ? post : delete_)(
      `${API_URL}/users/${gotrueId}/roles/${roleId}`,
      {}
    )
    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to ${checked ? 'add' : 'remove'} member's role: ${response.error.message}`,
      })
    } else {
      const updatedMembers = [...PageState.members]
      const updatedMember = updatedMembers.find((x) => x.id == member.id)
      if (checked) {
        updatedMember.role_ids.push(roleId)
      } else {
        updatedMember.role_ids = updatedMember.role_ids.filter(
          (role_id: number) => role_id != roleId
        )
      }
      mutateOrgMembers(updatedMembers)
      ui.setNotification({
        category: 'success',
        message: `Successfully ${checked ? 'added' : 'removed'} member's role`,
      })
    }
    setLoading(false)
  }

  return (
    <>
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
              PageState.filteredMembers.map((x: any, i: number) => {
                function findIdOfRole(roles: any, roleName: string) {
                  const found = roles.find((x: any) => x.name === roleName)
                  return found.id
                }

                const OwnerRoleId = roles && findIdOfRole(roles, 'Owner')
                const AdminRoleId = roles && findIdOfRole(roles, 'Administrator')
                const DeveloperRoleId = roles && findIdOfRole(roles, 'Developer')

                let activeRoleId: number | undefined = undefined

                /**
                 * Move through the roles and find the one that matches the user's role
                 * The bottom roles are the most senior ie, Owner
                 */
                if (x.role_ids?.includes(DeveloperRoleId)) {
                  activeRoleId = DeveloperRoleId
                }
                if (x.role_ids?.includes(AdminRoleId)) {
                  activeRoleId = AdminRoleId
                }
                if (x.role_ids?.includes(OwnerRoleId)) {
                  activeRoleId = OwnerRoleId
                }

                console.log(x.username, activeRoleId)

                return (
                  <>
                    <Table.tr key={i}>
                      <Table.td>
                        <div className="flex items-center space-x-4">
                          <div>
                            {x.invited_id ? (
                              <span className="border-border-secondary-light dark:border-border-secondary-dark flex rounded-full border-2 p-2">
                                <IconUser size={18} strokeWidth={2} />
                              </span>
                            ) : (
                              <Image
                                src={`https://github.com/${x.username}.png?size=80`}
                                width="40"
                                height="40"
                                className="border-border-secondary-light dark:border-border-secondary-dark rounded-full border"
                              />
                            )}
                          </div>
                          <div>
                            {x.username && !x.invited_id && (
                              <>
                                <Typography.Text>{x.username}</Typography.Text>
                                <br />
                              </>
                            )}
                            <Typography.Text type="secondary">{x.primary_email}</Typography.Text>
                          </div>
                        </div>
                      </Table.td>

                      <Table.td>
                        {x.invited_id && (
                          <Badge color={inviteExpired(x.invited_at) ? 'yellow' : 'red'}>
                            {inviteExpired(x.invited_at) ? 'Invited' : 'Expired'}
                          </Badge>
                        )}
                      </Table.td>

                      <Table.td>
                        {activeRoleId && (
                          <Listbox
                            value={activeRoleId ?? roles[0].id}
                            onChange={(roleId) => {
                              setUserRoleChangeModalVisible(true)
                              setSelectedUser({
                                ...x,
                                oldRoleId: activeRoleId,
                                newRoleId: roleId,
                              })
                            }}
                          >
                            {roles.map((role: any) => (
                              <Listbox.Option key={role.id} value={role.id} label={role.name}>
                                {role.name}
                              </Listbox.Option>
                            ))}
                          </Listbox>
                        )}
                      </Table.td>
                      <Table.td>
                        {PageState.isOrgOwner && (
                          // @ts-ignore
                          <OwnerDropdown members={PageState.members} member={x} roles={roles} />
                        )}
                      </Table.td>
                    </Table.tr>
                  </>
                )
              }),
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
      <Modal
        visible={userRoleChangeModalVisible}
        hideFooter
        header="Change role of member"
        size="small"
      >
        <div className="flex flex-col gap-2 my-3">
          <Modal.Content>
            <h3 className="text-scale-1200">
              By changing the role of this member their permissions will change.
            </h3>
          </Modal.Content>
          <Modal.Seperator />
          <Modal.Content>
            <div className="flex gap-3">
              <Button type="default" block size="medium">
                Cancel
              </Button>
              <Button type="warning" block size="medium">
                Confirm
              </Button>
            </div>
          </Modal.Content>
        </div>
      </Modal>
    </>
  )
})

const OwnerDropdown = observer(({ members, member, roles }: any) => {
  const PageState: any = useContext(PageContext)
  const { ui } = useStore()
  const { mutateOrgMembers } = useOrganizationDetail(ui.selectedOrganization?.slug || '')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // handle modal visibility
  const [ownerTransferIsVisble, setOwnerTransferIsVisble] = useState(false)

  const { id: orgId, slug: orgSlug, stripe_customer_id, name: orgName } = PageState.organization

  async function handleMemberDelete() {
    setIsOpen(false)
    await timeout(200)

    confirmAlert({
      title: 'Confirm to remove',
      message: `This is permanent! Are you sure you want to remove ${member.primary_email}?`,
      onAsyncConfirm: async () => {
        setLoading(true)
        const response = await delete_(`${API_URL}/organizations/${orgSlug}/members/remove`, {
          member_id: member.member_id,
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
          ui.setNotification({
            category: 'success',
            message: 'Successfully removed member',
          })
        }
      },
    })
  }

  async function handleTransfer() {
    setLoading(true)

    const response = await post(`${API_URL}/organizations/${orgSlug}/transfer`, {
      org_id: orgId,
      member_id: member.id,
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
      ui.setNotification({
        category: 'success',
        message: 'Successfully transfered organization',
      })
    }
  }

  async function handleRoleChecked(checked: boolean, roleId: number) {
    setLoading(true)
    const response = await (checked ? post : delete_)(
      `${API_URL}/users/${member.gotrue_id}/roles/${roleId}`,
      {}
    )
    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to ${checked ? 'add' : 'remove'} member's role: ${response.error.message}`,
      })
    } else {
      const updatedMembers = [...members]
      const updatedMember = updatedMembers.find((x) => x.id == member.id)
      if (checked) {
        updatedMember.role_ids.push(roleId)
      } else {
        updatedMember.role_ids = updatedMember.role_ids.filter(
          (role_id: number) => role_id != roleId
        )
      }
      mutateOrgMembers(updatedMembers)
      ui.setNotification({
        category: 'success',
        message: `Successfully ${checked ? 'added' : 'removed'} member's role`,
      })
    }
    setLoading(false)
  }

  async function handleResendInvite(member: Member) {
    setLoading(true)

    const response = await post(`${API_URL}/organizations/${orgSlug}/members/invite`, {
      invited_email: member.primary_email,
      owner_id: member.invited_id,
    })

    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to resend invitation: ${response.error.message}`,
      })
      setLoading(false)
    } else {
      const updatedMembers = [...members]
      mutateOrgMembers(updatedMembers)
      ui.setNotification({ category: 'success', message: 'Resent the invitation.' })
      setLoading(false)
    }
  }

  async function handleRevokeInvitation(id: number) {
    setLoading(true)

    const response = await delete_(
      `${API_URL}/organizations/${orgSlug}/members/invite?invited_id=${id}`,
      {}
    )

    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to revoke invitation: ${response.error.message}`,
      })
      setLoading(false)
    } else {
      const updatedMembers = [...members]
      mutateOrgMembers(updatedMembers)
      ui.setNotification({ category: 'success', message: 'Successfully revoked the invitation.' })
    }
  }

  return (
    <div className="flex items-center justify-end">
      <Dropdown
        side="bottom"
        align="end"
        overlay={
          <>
            <Dropdown.Label>Roles</Dropdown.Label>
            {roles &&
              roles
                ?.filter(({ name }: { name: string }) => name !== 'Owner')
                .map(({ id, name }: { id: number; name: string }) => (
                  <Dropdown.Checkbox
                    checked={member?.role_ids?.includes(id)}
                    onChange={(checked) => handleRoleChecked(checked, id)}
                  >
                    {name}
                  </Dropdown.Checkbox>
                ))}
            <Dropdown.Seperator />
            {!member.invited_at && (
              <Dropdown.Item onClick={() => setOwnerTransferIsVisble(!ownerTransferIsVisble)}>
                <div className="flex flex-col">
                  <p>Make owner</p>
                  <p className="block opacity-50">Transfer ownership of "{orgName}"</p>
                </div>
              </Dropdown.Item>
            )}

            {member.invited_at && (
              <>
                <Dropdown.Item onClick={() => handleRevokeInvitation(member.invited_id)}>
                  <div className="flex flex-col">
                    <p>Cancel invitation</p>
                    <p className="block opacity-50">Revoke this invitation.</p>
                  </div>
                </Dropdown.Item>

                {/* {!inviteExpired(member.invited_at) && ( */}
                <>
                  <Dropdown.Seperator />
                  <Dropdown.Item onClick={() => handleResendInvite(member)}>
                    <div className="flex flex-col">
                      <p>Resend invitation</p>
                      <p className="block opacity-50">Invites expire after 24hrs.</p>
                    </div>
                  </Dropdown.Item>
                </>
                {/* )} */}
              </>
            )}

            {!member.invited_at && (
              <>
                <Dropdown.Seperator />
                <Dropdown.Item icon={<IconTrash size="tiny" />} onClick={handleMemberDelete}>
                  Remove member
                </Dropdown.Item>
              </>
            )}
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
            <span className="font-medium dark:text-white">{member.profile?.username}</span>, they
            will also be able to remove you from the organization as a member
          </span>
        }
      />
    </div>
  )
})
