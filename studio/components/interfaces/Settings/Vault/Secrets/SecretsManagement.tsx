import { observer } from 'mobx-react-lite'
import { FC, Fragment, useState } from 'react'
import { IconSearch, Input, Button, Listbox, IconLoader } from 'ui'

import SecretRow from './SecretRow'
import EditSecretModal from './EditSecretModal'
import DeleteSecretModal from './DeleteSecretModal'
import AddNewSecretModal from './AddNewSecretModal'
import Divider from 'components/ui/Divider'
import { useStore } from 'hooks'

interface Props {}

const SecretsManagement: FC<Props> = ({}) => {
  const { vault } = useStore()
  const [searchValue, setSearchValue] = useState<string>('')
  const [selectedSort, setSelectedSort] = useState<'created_at' | 'name'>('created_at')
  const [showAddSecretModal, setShowAddSecretModal] = useState(false)
  const [selectedSecretToEdit, setSelectedSecretToEdit] = useState<any>()
  const [selectedSecretToRemove, setSelectedSecretToRemove] = useState<any>()

  const secrets = (
    searchValue.length > 0
      ? vault.listSecrets(
          (secret: any) =>
            (secret?.name ?? '').toLowerCase().includes(searchValue.toLowerCase()) ||
            secret.key_id.toLowerCase().includes(searchValue.toLowerCase())
        )
      : vault.listSecrets()
  ).sort((a: any, b: any) => {
    if (selectedSort === 'created_at') {
      return Number(new Date(a.created_at)) - Number(new Date(b.created_at))
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
            />
            <div className="w-32">
              <Listbox size="small" value={selectedSort} onChange={setSelectedSort}>
                <Listbox.Option
                  id="created_at"
                  className="max-w-[180px]"
                  value="created_at"
                  label="Sort by created at"
                >
                  Created at
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
          <Button type="primary" onClick={() => setShowAddSecretModal(true)}>
            Add new secret
          </Button>
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
