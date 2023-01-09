import Link from 'next/link'
import { observer } from 'mobx-react-lite'
import { FC, Fragment, useState, useEffect } from 'react'
import { IconSearch, Input, Button, Listbox, IconLoader, IconExternalLink, IconX } from 'ui'

import { useStore, useParams } from 'hooks'
import SecretRow from './SecretRow'
import EditSecretModal from './EditSecretModal'
import DeleteSecretModal from './DeleteSecretModal'
import AddNewSecretModal from './AddNewSecretModal'
import Divider from 'components/ui/Divider'

interface Props {}

const SecretsManagement: FC<Props> = ({}) => {
  const { vault } = useStore()
  const { search } = useParams()

  const [searchValue, setSearchValue] = useState<string>('')
  const [selectedSort, setSelectedSort] = useState<'updated_at' | 'name'>('updated_at')
  const [showAddSecretModal, setShowAddSecretModal] = useState(false)
  const [selectedSecretToEdit, setSelectedSecretToEdit] = useState<any>()
  const [selectedSecretToRemove, setSelectedSecretToRemove] = useState<any>()

  useEffect(() => {
    if (search !== undefined) setSearchValue(search)
  }, [search])

  const secrets = (
    searchValue.length > 0
      ? vault.listSecrets(
          (secret: any) =>
            (secret?.name ?? '').toLowerCase().includes(searchValue.toLowerCase()) ||
            secret.key_id.toLowerCase().includes(searchValue.toLowerCase())
        )
      : vault.listSecrets()
  ).sort((a: any, b: any) => {
    if (selectedSort === 'updated_at') {
      return Number(new Date(a.updated_at)) - Number(new Date(b.updated_at))
    } else {
      return a[selectedSort] > b[selectedSort] ? 1 : -1
    }
  })

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
            <div className="w-32">
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
            <Link href="https://supabase.com/docs/guides/database/vault">
              <a target="_blank">
                <Button type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                  Vault Documentation
                </Button>
              </a>
            </Link>
            <Button type="primary" onClick={() => setShowAddSecretModal(true)}>
              Add new secret
            </Button>
          </div>
        </div>

        {/* Table of secrets */}
        <div className="border border-scale-500 rounded">
          {!vault.isLoaded ? (
            <div className="px-6 py-6 space-x-2 flex items-center justify-center">
              <IconLoader className="animate-spin text-scale-1100" size={16} strokeWidth={1.5} />
              <p className="text-sm text-scale-1200">Loading secrets from the Vault</p>
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
                    {idx !== secrets.length - 1 && <Divider light />}
                  </Fragment>
                )
              })}
              {secrets.length === 0 && (
                <>
                  {searchValue.length === 0 ? (
                    <div className="px-6 py-6 space-y-1 flex flex-col items-center justify-center">
                      <p className="text-sm text-scale-1200">No secrets added yet</p>
                      <p className="text-sm text-scale-1100">
                        The Vault allows you to store sensitive information like API keys
                      </p>
                    </div>
                  ) : (
                    <div className="px-6 py-4 space-y-1">
                      <p className="text-sm text-scale-1200">No results found</p>
                      <p className="text-sm text-scale-1100">
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

export default observer(SecretsManagement)
