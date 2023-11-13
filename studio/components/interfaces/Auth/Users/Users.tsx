import { useParams } from 'common'
import { useState } from 'react'
import { Button, IconRefreshCw, IconSearch, IconX, Input, Listbox } from 'ui'

import { useIsAPIDocsSidePanelEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import APIDocsButton from 'components/ui/APIDocsButton'
import { useUsersQuery } from 'data/auth/users-query'
import AddUserDropdown from './AddUserDropdown'
import UsersList from './UsersList'

const Users = () => {
  const { project } = useProjectContext()
  const { ref: projectRef } = useParams()
  const isNewAPIDocsEnabled = useIsAPIDocsSidePanelEnabled()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterKeywords, setFilterKeywords] = useState('')
  const [filterVerified, setFilterVerified] = useState<'verified' | 'unverified'>()

  const { data, isLoading, isSuccess, refetch, isRefetching } = useUsersQuery({
    projectRef,
    page,
    keywords: filterKeywords,
    verified: filterVerified,
  })

  function onVerifiedFilterChange(e: any) {
    setFilterVerified(e)
  }

  function clearSearch() {
    setSearch('')
    setFilterKeywords('')
    setFilterVerified(undefined)
  }

  return (
    <div>
      <div className="justify-between px-6 pt-6 pb-2 md:flex">
        <div className="relative flex space-x-4">
          <Input
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.keyCode == 13) setFilterKeywords(search)
            }}
            className="min-w-[275px]"
            name="email"
            id="email"
            placeholder="Search by email or phone number"
            icon={<IconSearch size="tiny" />}
            actions={[
              search && (
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
            value={filterVerified}
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
          {isNewAPIDocsEnabled && <APIDocsButton section={['user-management']} />}
          <Button
            size="tiny"
            icon={<IconRefreshCw />}
            type="default"
            loading={isLoading || isRefetching}
            onClick={() => refetch()}
          >
            Reload
          </Button>
          <AddUserDropdown projectKpsVersion={project?.kpsVersion} />
        </div>
      </div>
      <section className="thin-scrollbars mt-4 overflow-visible px-6">
        <div className="section-block--body relative overflow-x-auto rounded">
          <div className="inline-block min-w-full align-middle">
            <UsersList
              page={page}
              setPage={setPage}
              keywords={filterKeywords}
              verified={filterVerified}
              total={data?.total ?? 0}
              users={data?.users ?? []}
              isLoading={isLoading}
              isSuccess={isSuccess}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

export default Users
