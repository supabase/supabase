import useSWR from 'swr'
import { Tabs } from '@supabase/ui'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { createContext, useContext, useEffect, useState } from 'react'

import { NextPageWithLayout, Project } from 'types'
import { useOrganizationDetail, useStore, withAuth } from 'hooks'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { AccountLayoutWithoutAuth } from 'components/layouts'
import {
  GeneralSettings,
  TeamSettings,
  BillingSettings,
  InvoicesSettings,
} from 'components/interfaces/Organization'

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
    }, [router.query])

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

const OrganizationSettings: NextPageWithLayout = () => {
  const PageState: any = useContext(PageContext)
  const { ui, app } = useStore()
  const [selectedTab, setSelectedTab] = useState('GENERAL')
  const { members, isError: isOrgDetailError } = useOrganizationDetail(
    ui.selectedOrganization?.slug || ''
  )

  useEffect(() => {
    if (!isOrgDetailError) {
      PageState.members = members ?? []
    }
  }, [members, isOrgDetailError])

  if (!ui.selectedOrganization || !PageState.organization) return <div />

  const organization = ui.selectedOrganization
  const projects = app.projects.list((x: Project) => x.organization_id == organization?.id)

  return (
    <div className="p-4 pt-0">
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
    </div>
  )
}

OrganizationSettings.getLayout = (page) => <OrgSettingsLayout>{page}</OrgSettingsLayout>
export default observer(OrganizationSettings)
