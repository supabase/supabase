import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DocsButton } from 'components/ui/DocsButton'
import { useVaultSecretsQuery } from 'data/vault/vault-secrets-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import { sortBy } from 'lodash'
import { RefreshCw, Search, X } from 'lucide-react'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'
import DataGrid, { Row } from 'react-data-grid'
import type { VaultSecret } from 'types'
import {
  Button,
  cn,
  LoadingLine,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

import { AddNewSecretModal } from './AddNewSecretModal'
import { DeleteSecretModal } from './DeleteSecretModal'
import { EditSecretModal } from './EditSecretModal'
import { formatSecretColumns } from './Secrets.utils'
import AlertError from '@/components/ui/AlertError'

export const SecretsManagement = () => {
  const { search } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const [searchValue, setSearchValue] = useState<string>('')
  const [, setShowAddSecretModal] = useQueryState('new', parseAsBoolean.withDefault(false))
  const [selectedSort, setSelectedSort] = useState<'updated_at' | 'name'>('updated_at')

  const { can: canManageSecrets } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'tables'
  )

  const {
    data,
    error,
    isError,
    isPending: isLoading,
    isRefetching,
    refetch,
  } = useVaultSecretsQuery({
    projectRef: project?.ref,
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

  const columns = useMemo(() => formatSecretColumns(), [])

  useEffect(() => {
    if (search !== undefined) setSearchValue(search)
  }, [search])

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
                icon={<Search />}
                value={searchValue ?? ''}
                onChange={(e) => setSearchValue(e.target.value)}
                actions={[
                  searchValue && (
                    <Button
                      key="clear"
                      size="tiny"
                      type="text"
                      icon={<X />}
                      onClick={() => setSearchValue('')}
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
              <DocsButton href={`${DOCS_URL}/guides/database/vault`} />
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
            <div className="flex-grow p-4">
              <AlertError error={error} subject="Failed to load secrets" />
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

      <AddNewSecretModal />

      <EditSecretModal />

      <DeleteSecretModal />
    </>
  )
}
