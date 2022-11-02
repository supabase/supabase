import React, { createContext, useContext, useEffect, PropsWithChildren } from 'react'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { get } from 'lib/common/fetch'

import { API_URL } from 'lib/constants'
import { checkPermissions, useStore } from 'hooks'
import { AuthLayout } from 'components/layouts'
import { Users } from 'components/interfaces/Auth'
import { NextPageWithLayout } from 'types'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import NoPermission from 'components/ui/NoPermission'

export const PageContext = createContext(null)

const PageLayout = ({ children }: PropsWithChildren<{}>) => {
  const PageState: any = useLocalObservable(() => ({
    projectRef: undefined,
    projectKpsVersion: undefined,
    filterInputValue: '',
    filterKeywords: '',
    filterVerified: undefined,
    users: [],
    totalUsers: 0,
    usersLoading: true,
    page: 1,
    pageLimit: 10,
    get fetchQuery() {
      let queryObj = {
        limit: this.pageLimit,
        offset: (this.page - 1) * this.pageLimit,
        keywords: this.filterKeywords,
      }

      return this.filterVerified ? { ...queryObj, verified: this.filterVerified } : queryObj
    },
    get fromRow() {
      const value = this.pageLimit * (this.page - 1) + 1
      if (value > this.totalUsers) return this.totalUsers
      return value
    },
    get toRow() {
      const value = this.pageLimit * this.page
      if (value > this.totalUsers) return this.totalUsers
      return value
    },
    get hasPrevious() {
      return this.page > 1
    },
    get hasNext() {
      return this.toRow < this.totalUsers
    },
    updateData(data: any) {
      this.usersLoading = false
      this.totalUsers = data.total
      this.users = data.users
    },
    async fetchData(page: any) {
      this.usersLoading = true
      this.page = page

      const query = new URLSearchParams(PageState.fetchQuery).toString()
      const url = `${API_URL}/auth/${PageState.projectRef}/users?${query}`
      const response = await get(url)
      if (response.error) {
        this.totalUsers = 0
        this.users = []
        this.usersLoading = false
        console.error(`Fetch user failed: ${response.error.message}`)
      } else {
        this.totalUsers = response.total
        this.users = response.users
        this.usersLoading = false
      }
    },
  }))
  const router = useRouter()
  PageState.projectRef = router.query.ref

  return <PageContext.Provider value={PageState}>{children}</PageContext.Provider>
}

const UsersPage: NextPageWithLayout = () => {
  const { ui } = useStore()
  const PageState: any = useContext(PageContext)
  const project: any = ui.selectedProject

  useEffect(() => {
    PageState!.projectKpsVersion = project?.kpsVersion
  }, [project])

  const canReadUsers = checkPermissions(PermissionAction.TENANT_SQL_SELECT, 'auth.users')

  return !canReadUsers ? (
    <NoPermission isFullPage resourceText="access your project's users" />
  ) : (
    <Users />
  )
}

UsersPage.getLayout = (page) => (
  <AuthLayout title="Auth">
    <PageLayout>{page}</PageLayout>
  </AuthLayout>
)

export default observer(UsersPage)
