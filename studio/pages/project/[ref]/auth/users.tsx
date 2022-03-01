import React, { createContext, useContext, useEffect } from 'react'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { get } from 'lib/common/fetch'

import { API_URL } from 'lib/constants'
import { withAuth, useStore } from 'hooks'
import { AuthLayout } from 'components/layouts'
import { Users } from 'components/interfaces/Authentication'

export const PageContext = createContext(null)

const Page = () => {
  const PageState: any = useLocalObservable(() => ({
    projectRef: undefined,
    projectKpsVersion: undefined,
    filterInputValue: '',
    filterKeywords: '',
    users: [],
    totalUsers: 0,
    usersLoading: true,
    page: 1,
    pageLimit: 10,
    get fetchQuery() {
      return {
        limit: this.pageLimit,
        offset: (this.page - 1) * this.pageLimit,
        keywords: this.filterKeywords,
      }
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

  return (
    <PageContext.Provider value={PageState}>
      <PageLayout />
    </PageContext.Provider>
  )
}
export default withAuth(observer(Page))

const PageLayout = observer(() => {
  const { ui } = useStore()
  const PageState: any = useContext(PageContext)
  const project: any = ui.selectedProject

  useEffect(() => {
    PageState!.projectKpsVersion = project?.kpsVersion
  }, [project])

  return (
    <AuthLayout title="Auth">
      <Users />
    </AuthLayout>
  )
})
