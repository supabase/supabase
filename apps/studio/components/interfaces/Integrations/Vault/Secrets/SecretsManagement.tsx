import { PermissionAction } from '@supabase/shared-types/out/constants'
import DataGrid, { Row } from 'react-data-grid'
import { sortBy } from 'lodash'
import { Loader, RefreshCw, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DocsButton } from 'components/ui/DocsButton'
import { useVaultSecretsQuery } from 'data/vault/vault-secrets-query'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import type { VaultSecret } from 'types'
import {
  Button,
  Input,
  LoadingLine,
  cn,
  Select_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
} from 'ui'
import AddNewSecretModal from './AddNewSecretModal'
import DeleteSecretModal from './DeleteSecretModal'
import { formatSecretColumns } from './Secrets.utils'

export const SecretsManagement = () => {
  const { search } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [searchValue, setSearchValue] = useState<string>('')
  const [showAddSecretModal, setShowAddSecretModal] = useState(false)
  const [selectedSecretToRemove, setSelectedSecretToRemove] = useState<VaultSecret>()
  const [selectedSort, setSelectedSort] = useState<'updated_at' | 'name'>('updated_at')

  const { can: canManageSecrets } = useAsyncCheckProjectPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'tables'
  )

  const { data, isLoading, isRefetching, refetch, error, isError } = useVaultSecretsQuery({
    projectRef: project?.ref!,
    connectionString: project?.connectionString,
  })
  const allSecrets = useMemo(() => data || [], [data])
  const secrets = useMemo(() => {
    const filtered =
      searchValue.length > 0
        ? allSecrets.filter(
            (secret) =>
              (secret?.name ?? '').toLowerCase().includes(searchValue.trim().toLowerCase()) ||
              (secret?.id ?? '').toLowerCase().includes(searchValue.trim().toLowerCase())
          )
        : allSecrets

    if (selectedSort === 'updated_at') {
      return sortBy(filtered, (s) => Number(new Date(s.updated_at))).reverse()
    }
    return sortBy(filtered, (s) => (s.name || '').toLowerCase())
  }, [allSecrets, searchValue, selectedSort])

  useEffect(() => {
    if (search !== undefined) setSearchValue(search)
  }, [search])

  const columns = useMemo(
    () =>
      formatSecretColumns({
        onSelectRemove: (secret) => setSelectedSecretToRemove(secret),
      }),
    []
  )

  return (
    <>
      <div className="h-full w-full space-y-4">
        <div className="h-full w-full flex flex-col relative">
          <div className="bg-surface-200 py-3 px-10 flex items-center justify-between flex-wrap">
            <div className="flex items-center gap-2">
              <Input
                size="tiny"
                className="w-52"
                placeholder="Search by name or key ID"
                icon={<Search size={14} />}
                value={searchValue ?? ''}
                onChange={(e) => setSearchValue(e.target.value)}
                actions={[
                  searchValue && (
                    <Button
                      size="tiny"
                      type="text"
                      icon={<X />}
                      onClick={() => {
                        setSearchValue('')
                      }}
                      className="p-0 h-5 w-5"
                    />
                  ),
                ]}
              />

              <Select_Shadcn_ value={selectedSort} onValueChange={(v) => setSelectedSort(v as any)}>
                <SelectTrigger_Shadcn_ size="tiny" className="w-44">
                  <SelectValue_Shadcn_ asChild>
                    <>Sort by {selectedSort}</>
                  </SelectValue_Shadcn_>
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  <SelectItem_Shadcn_ value="updated_at" className="text-xs">
                    Updated at
                  </SelectItem_Shadcn_>
                  <SelectItem_Shadcn_ value="name" className="text-xs">
                    Name
                  </SelectItem_Shadcn_>
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </div>

            <div className="flex items-center gap-x-2">
              <Button
                type="default"
                icon={<RefreshCw />}
                loading={isRefetching}
                onClick={() => refetch()}
              >
                Refresh
              </Button>
              <DocsButton href="https://supabase.com/docs/guides/database/vault" />
              <ButtonTooltip
                type="primary"
                disabled={!canManageSecrets}
                onClick={() => setShowAddSecretModal(true)}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: !canManageSecrets
                      ? 'You need additional permissions to add secrets'
                      : undefined,
                  },
                }}
              >
                Add new secret
              </ButtonTooltip>
            </div>
          </div>

          <LoadingLine loading={isLoading || isRefetching} />

          {isError ? (
            <div className="px-6 py-6 space-x-2 flex items-center justify-center">
              <p className="text-sm text-foreground">Failed to load secrets</p>
            </div>
          ) : (
            <DataGrid
              className="flex-grow border-t-0"
              rowHeight={52}
              headerRowHeight={36}
              columns={columns}
              rows={secrets}
              rowKeyGetter={(row: VaultSecret) => row.id}
              rowClass={() => {
                return cn(
                  'cursor-pointer',
                  '[&>.rdg-cell]:border-box [&>.rdg-cell]:outline-none [&>.rdg-cell]:shadow-none',
                  '[&>.rdg-cell:first-child>div]:pl-8'
                )
              }}
              renderers={{
                renderRow(_, props) {
                  return <Row key={(props.row as VaultSecret).id} {...props} />
                },
              }}
            />
          )}

          {secrets.length === 0 && !isLoading && !isError ? (
            <div className="absolute top-32 px-6 w-full">
              <div className="text-center text-sm flex flex-col gap-y-1">
                <p className="text-foreground">
                  {searchValue ? 'No secrets found' : 'No secrets added yet'}
                </p>
                <p className="text-foreground-light">
                  {searchValue
                    ? `There are currently no secrets based on the search "${searchValue}"`
                    : 'The Vault allows you to store sensitive information like API keys'}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <DeleteSecretModal
        selectedSecret={selectedSecretToRemove}
        onClose={() => setSelectedSecretToRemove(undefined)}
      />
      <AddNewSecretModal
        visible={showAddSecretModal}
        onClose={() => setShowAddSecretModal(false)}
      />
    </>
  )
}
