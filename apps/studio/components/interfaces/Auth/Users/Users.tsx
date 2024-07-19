import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useIsAPIDocsSidePanelEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import APIDocsButton from 'components/ui/APIDocsButton'
import NoPermission from 'components/ui/NoPermission'
import { authKeys } from 'data/auth/keys'
import { useUsersQuery } from 'data/auth/users-query'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { Search, X } from 'lucide-react'
import { Button, IconRefreshCw, Input, Listbox } from 'ui'
import AddUserDropdown from './AddUserDropdown'
import UsersList from './UsersList'

const Users = () => {
  const queryClient = useQueryClient()
  const { project } = useProjectContext()
  const { ref: projectRef } = useParams()
  const isNewAPIDocsEnabled = useIsAPIDocsSidePanelEnabled()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterKeywords, setFilterKeywords] = useState('')
  type Filter = 'verified' | 'unverified' | 'anonymous'
  const [filter, setFilter] = useState<Filter>()

  const canReadUsers = useCheckPermissions(PermissionAction.TENANT_SQL_SELECT, 'auth.users')
  const isPermissionsLoaded = usePermissionsLoaded()

  const {
    data,
    isLoading,
    isSuccess,
    refetch,
    isRefetching,
    error,
    isPreviousData: isFetchingNextPage,
  } = useUsersQuery(
    {
      projectRef,
      page,
      keywords: filterKeywords,
      filter,
      connectionString: project?.connectionString!,
    },
    {
      keepPreviousData: true,
      onSuccess(data) {
        if (data.users.length <= 0 && data.total > 0) {
          queryClient.removeQueries(
            authKeys.users(projectRef, { page, keywords: filterKeywords, filter })
          )

          setPage((prev) => prev - 1)
        }
      },
    }
  )

  function onVerifiedFilterChange(val: Filter) {
    setFilter(val)
  }

  function clearSearch() {
    setSearch('')
    setFilterKeywords('')
    setFilter(undefined)
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
            icon={<Search size={14} />}
            actions={[
              search && (
                <Button size="tiny" type="text" icon={<X />} onClick={() => clearSearch()} />
              ),
            ]}
          />
          <Listbox
            size="small"
            value={filter}
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
            <Listbox.Option label="Anonymous Users" value="anonymous">
              Anonymous Users
            </Listbox.Option>
          </Listbox>
        </div>
        <div className="mt-4 flex items-center gap-2 md:mt-0">
          {isNewAPIDocsEnabled && <APIDocsButton section={['user-management']} />}
          <Button
            size="tiny"
            icon={<IconRefreshCw />}
            type="default"
            loading={isRefetching && !isFetchingNextPage}
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
            {isPermissionsLoaded && !canReadUsers ? (
              <div className="mt-8">
                <NoPermission isFullPage resourceText="access your project's users" />
              </div>
            ) : (
              <UsersList
                page={page}
                setPage={setPage}
                keywords={filterKeywords}
                total={data?.total ?? 0}
                users={data?.users ?? []}
                isLoading={isLoading}
                isSuccess={isSuccess}
                isFetchingNextPage={isFetchingNextPage}
                error={error}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Users
