import semver from 'semver'
import { useEffect, useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, Input, IconSearch, IconX } from '@supabase/ui'

import { PageContext } from 'pages/project/[ref]/auth/users'
import { IS_PLATFORM } from 'lib/constants'
import UsersList from './UsersList'
import InviteUserModal from './InviteUserModal'

const Users = () => {
  const PageState: any = useContext(PageContext)
  const inviteEnabled =
    IS_PLATFORM &&
    semver.gte(
      // @ts-ignore
      semver.coerce(PageState.projectKpsVersion || 'kps-v2.5.4'),
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
            <UsersList />
          </div>
        </div>
      </section>
    </div>
  )
}

export default observer(Users)
