import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { sortBy } from 'lodash'
import Link from 'next/link'
import { Fragment, useEffect, useState } from 'react'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useVaultSecretsQuery } from 'data/vault/vault-secrets-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import type { VaultSecret } from 'types'
import {
  Button,
  IconExternalLink,
  IconLoader,
  IconSearch,
  IconX,
  Input,
  Listbox,
  Separator,
} from 'ui'
import AddNewSecretModal from './AddNewSecretModal'
import DeleteSecretModal from './DeleteSecretModal'
import EditSecretModal from './EditSecretModal'
import SecretRow from './SecretRow'

const SecretsManagement = () => {
  const { search } = useParams()
  const { project } = useProjectContext()

  const [searchValue, setSearchValue] = useState<string>('')
  const [selectedSort, setSelectedSort] = useState<'updated_at' | 'name'>('updated_at')
  const [showAddSecretModal, setShowAddSecretModal] = useState(false)
  const [selectedSecretToEdit, setSelectedSecretToEdit] = useState<VaultSecret>()
  const [selectedSecretToRemove, setSelectedSecretToRemove] = useState<VaultSecret>()

  const canManageSecrets = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')

  useEffect(() => {
    if (search !== undefined) setSearchValue(search)
  }, [search])

  const { data, isLoading } = useVaultSecretsQuery({
    projectRef: project?.ref!,
    connectionString: project?.connectionString,
  })
  const allSecrets = data || []
  const secrets = sortBy(
    searchValue.length > 0
      ? allSecrets.filter(
          (secret) =>
            (secret?.name ?? '').toLowerCase().includes(searchValue.toLowerCase()) ||
            secret.key_id.toLowerCase().includes(searchValue.toLowerCase())
        )
      : allSecrets,
    (s) => {
      if (selectedSort === 'updated_at') {
        return Number(new Date(s.updated_at))
      } else {
        return s[selectedSort]
      }
    }
  )

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Input
              className="w-64"
              size="small"
              placeholder="Search by name or key ID"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              icon={<IconSearch strokeWidth={2} size={16} />}
              actions={
                searchValue.length > 0
                  ? [
                      <Button
                        key="clear"
                        size="tiny"
                        type="text"
                        icon={<IconX />}
                        className="px-1"
                        onClick={() => setSearchValue('')}
                      />,
                    ]
                  : []
              }
            />
            <div className="w-44">
              <Listbox size="small" value={selectedSort} onChange={setSelectedSort}>
                <Listbox.Option
                  id="updated_at"
                  className="max-w-[180px]"
                  value="updated_at"
                  label="Sort by updated at"
                >
                  Updated at
                </Listbox.Option>
                <Listbox.Option
                  id="name"
                  className="max-w-[180px]"
                  value="name"
                  label="Sort by name"
                >
                  Name
                </Listbox.Option>
                <Listbox.Option
                  id="key_id"
                  className="max-w-[180px]"
                  value="key_id"
                  label="Sort by key ID"
                >
                  Key ID
                </Listbox.Option>
              </Listbox>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
              <Link
                href="https://supabase.com/docs/guides/database/vault"
                target="_blank"
                rel="noreferrer"
              >
                Vault Documentation
              </Link>
            </Button>
            <Tooltip.Root delayDuration={0}>
              <Tooltip.Trigger asChild>
                <Button
                  type="primary"
                  disabled={!canManageSecrets}
                  onClick={() => setShowAddSecretModal(true)}
                >
                  Add new secret
                </Button>
              </Tooltip.Trigger>
              {!canManageSecrets && (
                <Tooltip.Portal>
                  <Tooltip.Content side="bottom">
                    <Tooltip.Arrow className="radix-tooltip-arrow" />
                    <div
                      className={[
                        'rounded bg-alternative py-1 px-2 leading-none shadow',
                        'border border-background',
                      ].join(' ')}
                    >
                      <span className="text-xs text-foreground">
                        You need additional permissions to add secrets
                      </span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
          </div>
        </div>

        {/* Table of secrets */}
        <div className="border border-default rounded">
          {isLoading ? (
            <div className="px-6 py-6 space-x-2 flex items-center justify-center">
              <IconLoader
                className="animate-spin text-foreground-light"
                size={16}
                strokeWidth={1.5}
              />
              <p className="text-sm text-foreground">Loading secrets from the Vault</p>
            </div>
          ) : (
            <>
              {secrets.map((secret, idx) => {
                return (
                  <Fragment key={`secret-${idx}`}>
                    <SecretRow
                      secret={secret}
                      onSelectEdit={setSelectedSecretToEdit}
                      onSelectRemove={setSelectedSecretToRemove}
                    />
                    {idx !== secrets.length - 1 && <Separator />}
                  </Fragment>
                )
              })}
              {secrets.length === 0 && (
                <>
                  {searchValue.length === 0 ? (
                    <div className="px-6 py-6 space-y-1 flex flex-col items-center justify-center">
                      <p className="text-sm text-foreground">No secrets added yet</p>
                      <p className="text-sm text-foreground-light">
                        The Vault allows you to store sensitive information like API keys
                      </p>
                    </div>
                  ) : (
                    <div className="px-6 py-4 space-y-1">
                      <p className="text-sm text-foreground">No results found</p>
                      <p className="text-sm text-foreground-light">
                        Your search for "{searchValue}" did not return any results
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <EditSecretModal
        selectedSecret={selectedSecretToEdit}
        onClose={() => setSelectedSecretToEdit(undefined)}
      />
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

export default SecretsManagement
