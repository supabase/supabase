import React, { createContext, useRef, useContext, useEffect, useState, FC } from 'react'
import dayjs from 'dayjs'
import semver from 'semver'
import { toJS } from 'mobx'
import { observer, useLocalObservable } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { get, delete_, post } from 'lib/common/fetch'
import { timeout } from 'lib/helpers'
import {
  Button,
  IconMoreHorizontal,
  IconPlus,
  Input,
  IconSearch,
  Badge,
  Typography,
  Loading,
  IconX,
  Dropdown,
  Divider,
  IconTrash,
  Modal,
  IconMail,
} from '@supabase/ui'

import { API_URL } from 'lib/constants'
import { withAuth, useStore } from 'hooks'
import { AuthLayout } from 'components/layouts'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'
import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'
import Table from 'components/to-be-cleaned/Table'

const PageContext = createContext(null)
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
      <div className="p-4">
        <Users />
      </div>
    </AuthLayout>
  )
})

const Users = observer(() => {
  const PageState: any = useContext(PageContext)
  const inviteEnabled = semver.gte(
    // @ts-ignore
    semver.coerce(toJS(PageState.projectKpsVersion) || 'kps-v2.5.4'),
    semver.coerce('kps-v2.5.3')
  )

  useEffect(() => {
    PageState.fetchData(1)
  }, [])

  function onFilterChange(e: any) {
    PageState.filterInputValue = e.target.value
  }

  function onFilterKeyPress(e: any) {
    // enter key
    if (e.keyCode == 13) onSearchUser()
  }

  function onSearchUser() {
    PageState.filterKeywords = PageState.filterInputValue
    PageState.fetchData(1)
  }

  function clearSearch() {
    PageState.filterInputValue = ''
    PageState.filterKeywords = ''
    PageState.fetchData(1)
  }

  return (
    <div className="">
      <div className="flex justify-between">
        <div className="relative flex space-x-1">
          <Input
            size="tiny"
            value={PageState.filterInputValue}
            onChange={onFilterChange}
            onKeyDown={onFilterKeyPress}
            name="email"
            id="email"
            placeholder="Search by email"
            icon={<IconSearch size="tiny" />}
            actions={[
              PageState.filterInputValue && (
                <Button
                  size="tiny"
                  type="text"
                  icon={<IconX size="tiny" />}
                  onClick={() => clearSearch()}
                />
              ),
            ]}
          />
        </div>
        {inviteEnabled && <InviteUserModal />}
      </div>
      <section className="overflow-visible mt-4">
        <div className="relative section-block--body rounded">
          <div className="align-middle inline-block min-w-full">
            <UserList />
          </div>
        </div>
      </section>
    </div>
  )
})

const UsersPagination = observer(() => {
  const PageState: any = useContext(PageContext)

  function onNext() {
    PageState.fetchData(PageState.page + 1)
  }

  function onPrevious() {
    PageState.fetchData(PageState.page - 1)
  }

  return (
    <nav className="flex items-center justify-between overflow-hidden" aria-label="Pagination">
      <div className="hidden sm:block">
        <p className="text-xs text-gray-400">
          Showing
          <span className="px-1 font-medium text-gray-400">{PageState.fromRow}</span>
          to
          <span className="px-1 font-medium text-gray-400">{PageState.toRow}</span>
          of
          <span className="px-1 font-medium text-gray-400">{PageState.totalUsers}</span>
          results
        </p>
      </div>
      <div className="flex-1 flex justify-between sm:justify-end">
        {PageState.hasPrevious && (
          <Button type="secondary" disabled={!PageState.hasPrevious} onClick={onPrevious}>
            Previous
          </Button>
        )}
        {PageState.hasNext && (
          <Button type="secondary" disabled={!PageState.hasNext} className="ml-3" onClick={onNext}>
            Next
          </Button>
        )}
      </div>
    </nav>
  )
})

const InviteUserModal = observer(() => {
  const PageState: any = useContext(PageContext)
  const inputRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailValue, setEmailValue] = useState('')

  function handleToggle() {
    // reset data before showing modal again
    if (!visible) {
      setEmailValue('')
    }
    setVisible(!visible)
  }

  function onInputChange(e: any) {
    setEmailValue(e.target.value)
  }

  async function onInviteUser() {
    const emailValidateRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
    if (!emailValidateRegex.test(emailValue)) {
      // focus input
      ;(inputRef?.current as any)?.focus()
      // show error
      let message = `${emailValue} is an invalid email`
      if (emailValue.trim() == '') message = 'Please enter a valid email'
      toast.error(message)
      return
    }

    try {
      setLoading(true)
      const response = await post(`${API_URL}/auth/${PageState.projectRef}/invite`, {
        email: emailValue,
      })
      if (response.error) {
        toast.error(`Inviting user failed: ${response.error.message}`)
      } else {
        PageState.fetchData(1)
        toast(`Sent invite email to ${emailValue}`)
      }
    } catch (error) {
      console.error('onInviteUser error:', error)
      toast.error(`Inviting user failed`)
    } finally {
      setLoading(false)
      setVisible(false)
    }
  }

  return (
    <div>
      <Button onClick={handleToggle} icon={<IconPlus />}>
        Invite
      </Button>
      <Modal
        size="small"
        key="invite-user-modal"
        visible={visible}
        title="Invite new user"
        hideFooter
        onCancel={handleToggle}
        closable
      >
        <Input
          label="User email"
          icon={<IconMail />}
          autoFocus
          // @ts-ignore
          ref={inputRef}
          value={emailValue}
          onChange={onInputChange}
          type="text"
          name="email"
          id="email"
          placeholder="User email"
          className="w-full"
        />

        <Button onClick={onInviteUser} loading={loading} disabled={loading} block>
          Invite user
        </Button>
      </Modal>
    </div>
  )
})

const UserList = observer(({}) => {
  const PageState: any = useContext(PageContext)

  return (
    <Loading active={PageState.usersLoading}>
      <Table
        head={
          <>
            <Table.th>Email</Table.th>
            <Table.th>Phone</Table.th>
            <Table.th className="hidden 2xl:table-cell">Provider</Table.th>
            <Table.th className="hidden 2xl:table-cell">Created</Table.th>
            <Table.th className="hidden xl:table-cell">Last Sign In</Table.th>
            <Table.th className="hidden lg:table-cell">User UID</Table.th>
            <Table.th></Table.th>
          </>
        }
        body={
          <>
            {PageState.users.length == 0 && (
              <Table.tr>
                {/* @ts-ignore */}
                <Table.td
                  colSpan={7}
                  className="h-28 p-4 whitespace-nowrap border-t leading-5 text-gray-300 text-sm"
                ></Table.td>
              </Table.tr>
            )}
            {PageState.users.length > 0 &&
              PageState.users.map((x: any) => <UserListItem key={x.id} user={x} />)}
            <Table.tr>
              <Table.td colSpan={7}>
                <UsersPagination />
              </Table.td>
            </Table.tr>
          </>
        }
      />
    </Loading>
  )
})

const UserListItem: FC<{ user: any }> = observer(({ user }) => {
  const isUserConfirmed = user.email_confirmed_at || user.phone_confirmed_at
  return (
    <Table.tr key={user.id}>
      <Table.td className="whitespace-nowrap">
        <Typography.Text>{!user.email ? '-' : user.email}</Typography.Text>
      </Table.td>
      <Table.td className="whitespace-nowrap">
        <Typography.Text>{!user.phone ? '-' : user.phone}</Typography.Text>
      </Table.td>
      <Table.td className="hidden 2xl:table-cell">
        <Typography.Text type="secondary" className="capitalize">
          {user?.raw_app_meta_data?.provider || user?.app_metadata?.provider}
        </Typography.Text>
      </Table.td>
      <Table.td className="hidden 2xl:table-cell">
        <Typography.Text type="secondary" small>
          {dayjs(user.created_at).format('DD MMM, YYYY HH:mm')}
        </Typography.Text>
      </Table.td>
      <Table.td className="hidden xl:table-cell">
        {!isUserConfirmed ? (
          <Badge color="yellow">Waiting for verification..</Badge>
        ) : user.last_sign_in_at ? (
          dayjs(user.last_sign_in_at).format('DD MMM, YYYY HH:mm')
        ) : (
          'Never'
        )}
      </Table.td>
      <Table.td className="hidden lg:table-cell">
        <SimpleCodeBlock metastring="" className="font-xs bash">
          {user.id}
        </SimpleCodeBlock>
      </Table.td>
      <Table.td className="text-right">
        <UserDropdown user={user} />
      </Table.td>
    </Table.tr>
  )
})

const UserDropdown: FC<{ user: any }> = observer(({ user }) => {
  const PageState: any = useContext(PageContext)
  const [loading, setLoading] = useState(false)

  async function handleResetPassword() {
    try {
      setLoading(true)
      const response = await post(`${API_URL}/auth/${PageState.projectRef}/recover`, user)
      if (response.error) {
        toast.error(`Send password recovery failed: ${response.error.message}`)
      } else {
        toast(`Sent password recovery to ${user.email}`)
      }
    } catch (error) {
      console.error('handleResetPassword error:', error)
      toast.error(`Send password recovery failed`)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendMagicLink() {
    try {
      setLoading(true)
      const response = await post(`${API_URL}/auth/${PageState.projectRef}/magiclink`, user)
      if (response.error) {
        toast.error(`Sending magic link failed: ${response.error.message}`)
      } else {
        toast(`Sent magic link to ${user.email}`)
      }
    } catch (error) {
      console.error('handleSendMagicLink error:', error)
      toast.error(`Sending magic link failed`)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendOtp() {
    try {
      setLoading(true)
      const response = await post(`${API_URL}/auth/${PageState.projectRef}/otp`, user)
      if (response.error) {
        toast.error(`Sending OTP failed: ${response.error.message}`)
      } else {
        toast(`Sent OTP to ${user.phone}`)
      }
    } catch (error) {
      console.error('handleSendOtp error:', error)
      toast.error(`Sending OTP failed`)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    await timeout(200)

    confirmAlert({
      title: 'Confirm to delete',
      message: `This is permanent! Are you sure you want to delete user ${user.email} ?`,
      onAsyncConfirm: async () => {
        setLoading(true)
        const response = await delete_(`${API_URL}/auth/${PageState.projectRef}/users`, user)
        if (response.error) {
          toast.error(`Deleting user failed: ${response.error.message}`)
        } else {
          toast(`User ${user.email} deleted`)
          PageState.users = PageState.users.filter((x: any) => x.id != user.id)
        }
        setLoading(false)
      },
    })
  }

  return (
    <Dropdown
      overlay={
        <>
          {user.email !== null ? (
            <>
              <Dropdown.Item onClick={handleResetPassword} icon={<IconMail size="tiny" />}>
                Send password recovery
              </Dropdown.Item>
              <Dropdown.Item onClick={handleSendMagicLink} icon={<IconMail size="tiny" />}>
                Send magic link
              </Dropdown.Item>
            </>
          ) : null}
          {user.phone !== null ? (
            <Dropdown.Item onClick={handleSendOtp} icon={<IconMail size="tiny" />}>
              Send OTP
            </Dropdown.Item>
          ) : null}
          <Divider light />
          <Dropdown.Item onClick={handleDelete} icon={<IconTrash size="tiny" />}>
            Delete user
          </Dropdown.Item>
        </>
      }
    >
      <Button
        as="span"
        type="text"
        icon={<IconMoreHorizontal />}
        loading={loading}
        className="hover:border-gray-500"
      />
    </Dropdown>
  )
})
