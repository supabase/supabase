import semver from 'semver'
import { useEffect, useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, Input, IconSearch, IconX, IconRefreshCw, Listbox, IconUsers } from 'ui'

import { IS_PLATFORM } from 'lib/constants'
import { PageContext } from 'pages/project/[ref]/auth/users'
import UsersList from './UsersList'
import InviteUserModal from './InviteUserModal'

const Users = () => {
  const PageState: any = useContext(PageContext)
  const inviteEnabled = IS_PLATFORM
    ? semver.gte(
        // @ts-ignore
        semver.coerce(PageState?.projectKpsVersion ?? 'kps-v2.5.4'),
        semver.coerce('kps-v2.5.3')
      )
    : true

  useEffect(() => {
    PageState.fetchData(1)
  }, [])

  function onFilterChange(e: any) {
    PageState.filterInputValue = e.target.value
  }

  function onVerifiedFilterChange(e: any) {
    PageState.filterVerified = e
    onSearchUser()
  }

  function onFilterKeyPress(e: any) {
    // enter key
    if (e.keyCode == 13) onSearchUser()
  }

  function onSearchUser() {
    PageState.filterKeywords = PageState.filterInputValue
    PageState.filterVerified = PageState.filterVerified
    PageState.fetchData(1)
  }

  function clearSearch() {
    PageState.filterInputValue = ''
    PageState.filterKeywords = ''
    PageState.fetchData(1)
  }

  function refreshUsers() {
    PageState.fetchData(1)
  }

  return (
    <div>
      <div className="justify-between px-6 pt-6 pb-2 md:flex">
        <div className="relative flex space-x-4">
          <Input
            size="small"
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
          <Listbox
            size="small"
            value={PageState.filterVerified}
            onChange={onVerifiedFilterChange}
            name="verified"
            id="verified"
          >
            <Listbox.Option label="All Users" value="">
              All Users
            </Listbox.Option>
            <Listbox.Option label="Verified Users" value="verified">
              Verified Users
            </Listbox.Option>
            <Listbox.Option label="Un-Verified Users" value="unverified">
              Un-Verified Users
            </Listbox.Option>
          </Listbox>
        </div>
        <div className="mt-4 flex items-center md:mt-0">
          <Button
            className="mr-2"
            size="tiny"
            icon={<IconRefreshCw />}
            type="default"
            loading={PageState.usersLoading}
            onClick={refreshUsers}
          >
            Reload
          </Button>
          {inviteEnabled && <InviteUserModal />}
        </div>
      </div>
      <section className="users-table-container mt-4 overflow-visible px-6">
        <div className="section-block--body relative overflow-x-auto rounded">
          <div className="inline-block min-w-full align-middle">
            <UsersList />
          </div>
        </div>
      </section>
    </div>
  )
}

export default observer(Users)
