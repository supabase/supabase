import { observer } from 'mobx-react-lite'
import { useContext, useEffect } from 'react'
import { Button, IconRefreshCw, IconSearch, IconX, Input, Listbox } from 'ui'

import { PageContext } from 'pages/project/[ref]/auth/users'
import AddUserDropdown from './AddUserDropdown'
import UsersList from './UsersList'

const Users = () => {
  const PageState: any = useContext(PageContext)

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
            className="min-w-[275px]"
            name="email"
            id="email"
            placeholder="Search by email or phone number"
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
            className="w-[200px]"
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
        <div className="mt-4 flex items-center gap-2 md:mt-0">
          <Button
            size="tiny"
            icon={<IconRefreshCw />}
            type="default"
            loading={PageState.usersLoading}
            onClick={refreshUsers}
          >
            Reload
          </Button>

          <AddUserDropdown projectKpsVersion={PageState?.projectKpsVersion} />
        </div>
      </div>
      <section className="thin-scrollbars mt-4 overflow-visible px-6">
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
