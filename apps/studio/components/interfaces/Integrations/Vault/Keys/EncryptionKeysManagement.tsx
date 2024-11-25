import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import { sortBy } from 'lodash'
import { Fragment, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DocsButton } from 'components/ui/DocsButton'
import { usePgSodiumKeyCreateMutation } from 'data/pg-sodium-keys/pg-sodium-key-create-mutation'
import { usePgSodiumKeyDeleteMutation } from 'data/pg-sodium-keys/pg-sodium-key-delete-mutation'
import { usePgSodiumKeysQuery } from 'data/pg-sodium-keys/pg-sodium-keys-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { Key, Loader, Search, Trash, X } from 'lucide-react'
import { Alert, Button, Form, Input, Listbox, Modal, Separator } from 'ui'

const DEFAULT_KEY_NAME = 'No description provided'

export const EncryptionKeysManagement = () => {
  const { search } = useParams()
  const { project } = useProjectContext()

  const [searchValue, setSearchValue] = useState<string>('')
  const [selectedSort, setSelectedSort] = useState<'name' | 'created'>('created')
  const [showAddKeyModal, setShowAddKeyModal] = useState(false)
  const [selectedKeyToRemove, setSelectedKeyToRemove] = useState<any>()
  const canManageKeys = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')

  useEffect(() => {
    if (search !== undefined) setSearchValue(search)
  }, [search])

  const { data, isLoading } = usePgSodiumKeysQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { mutate: addKeyMutation, isLoading: isCreating } = usePgSodiumKeyCreateMutation({
    onSuccess: () => {
      toast.success('Successfully added new key')
      setShowAddKeyModal(false)
    },
  })
  const { mutate: deleteKeyMutation, isLoading: isDeleting } = usePgSodiumKeyDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully deleted encryption key`)
      setSelectedKeyToRemove(undefined)
    },
  })

  const allKeys = data || []
  const keys = sortBy(
    searchValue
      ? allKeys.filter(
          (key) =>
            (key?.name ?? '').toLowerCase().includes(searchValue.toLowerCase()) ||
            key.id.toLowerCase().includes(searchValue.toLowerCase())
        )
      : allKeys,
    (k) => {
      if (selectedSort === 'created') {
        return Number(new Date(k.created))
      } else {
        return k[selectedSort]
      }
    }
  )

  const addKey = async (values: any, { setSubmitting }: any) => {
    if (!project) return console.error('Project is required')

    addKeyMutation({
      projectRef: project.ref,
      connectionString: project.connectionString,
      name: values.name,
    })
  }

  const confirmDeleteKey = async () => {
    if (!selectedKeyToRemove) return
    if (!project) return console.error('Project is required')

    deleteKeyMutation({
      projectRef: project.ref,
      connectionString: project.connectionString,
      id: selectedKeyToRemove.id,
    })
  }

  return (
    <>
      <div className="space-y-4 p-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Input
              className="w-52 input-clear"
              size="tiny"
              placeholder="Search by name or ID"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              icon={<Search strokeWidth={2} size={16} />}
              actions={
                searchValue.length > 0
                  ? [
                      <Button
                        key="clear"
                        size="tiny"
                        type="text"
                        icon={<X />}
                        className="px-1"
                        onClick={() => setSearchValue('')}
                      />,
                    ]
                  : []
              }
            />
            <div className="w-44">
              <Listbox size="tiny" value={selectedSort} onChange={setSelectedSort}>
                <Listbox.Option
                  id="created"
                  className="max-w-[180px]"
                  value="created"
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
              </Listbox>
            </div>
          </div>
          <div className="flex items-center gap-x-2">
            <DocsButton href="https://supabase.com/docs/guides/database/vault" />
            <ButtonTooltip
              type="primary"
              disabled={!canManageKeys}
              onClick={() => setShowAddKeyModal(true)}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: !canManageKeys ? 'You need additional permissions to add keys' : undefined,
                },
              }}
            >
              Add new key
            </ButtonTooltip>
          </div>
        </div>

        {/* Table of keys */}
        <div className="border rounded">
          {isLoading ? (
            <div className="px-6 py-6 space-x-2 flex items-center justify-center">
              <Loader className="animate-spin text-foreground-light" size={16} strokeWidth={1.5} />
              <p className="text-sm text-foreground">Loading keys from the Vault</p>
            </div>
          ) : (
            <>
              {keys.map((key, idx) => {
                return (
                  <Fragment key={key.key_id}>
                    <div className="px-6 py-4 flex items-center space-x-4">
                      <Key className="text-foreground-light" strokeWidth={2} />
                      <div className="space-y-1 min-w-[70%] max-w-[70%]">
                        <p
                          className="text-sm truncate text-foreground"
                          title={key.name || DEFAULT_KEY_NAME}
                        >
                          {key.name || DEFAULT_KEY_NAME}
                        </p>
                        <p
                          title={key.id}
                          className="text-xs text-foreground-light font-bold truncate"
                        >
                          ID: <span className="font-mono">{key.id}</span>
                        </p>
                      </div>
                      <div className="flex items-center justify-end w-[30%] space-x-4">
                        <p className="text-sm text-foreground-light">
                          Added on {dayjs(key.created).format('MMM D, YYYY')}
                        </p>
                        <Tooltip.Root delayDuration={0}>
                          <Tooltip.Trigger asChild>
                            <Button
                              type="default"
                              className="py-2"
                              icon={<Trash />}
                              disabled={!canManageKeys}
                              onClick={() => setSelectedKeyToRemove(key)}
                            />
                          </Tooltip.Trigger>
                          {!canManageKeys && (
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
                                    You need additional permissions to delete keys
                                  </span>
                                </div>
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          )}
                        </Tooltip.Root>
                      </div>
                    </div>
                    {idx !== keys.length - 1 && <Separator />}
                  </Fragment>
                )
              })}
              {keys.length === 0 && (
                <>
                  {searchValue.length === 0 ? (
                    <div className="px-6 py-6 space-y-1 flex flex-col items-center justify-center">
                      <p className="text-sm text-foreground">No encryption keys added yet</p>
                      <p className="text-sm text-foreground-light text-center">
                        Encryption keys are created by the pgsodium extension and can be used to
                        encrypt your columns and secrets
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

      <Modal
        closable
        size="medium"
        alignFooter="right"
        visible={selectedKeyToRemove !== undefined}
        onCancel={() => setSelectedKeyToRemove(undefined)}
        onConfirm={confirmDeleteKey}
        loading={isDeleting}
        header="Confirm to delete key"
      >
        <Modal.Content className="space-y-4">
          <Alert
            withIcon
            variant="warning"
            title="Deleting a key that's in use will cause any secret or column which depends on it to be unusable."
          >
            Do ensure that the key is not currently in use to prevent any issues.
          </Alert>
          <p className="text-sm">
            The following key will be permanently removed and cannot be recovered.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-foreground">
              {selectedKeyToRemove?.name ?? DEFAULT_KEY_NAME}
            </p>
            <p className="text-xs text-foreground-light">
              <code className="!mx-0">ID: {selectedKeyToRemove?.id}</code>
            </p>
          </div>
        </Modal.Content>
      </Modal>

      <Modal
        closable
        hideFooter
        size="medium"
        visible={showAddKeyModal}
        onCancel={() => setShowAddKeyModal(false)}
        header="Add a new key"
      >
        <Form
          id="add-new-key-form"
          validateOnBlur={false}
          initialValues={{ name: '' }}
          validate={(values: any) => {
            const errors: any = {}
            if (values.name.length === 0) errors.name = 'Please provide a name for your key'
            return errors
          }}
          onSubmit={addKey}
        >
          {() => {
            return (
              <>
                <Modal.Content className="space-y-4">
                  <p className="text-sm">Provide a name for your key for easier identification.</p>
                  <Input id="name" label="Key Name" />
                </Modal.Content>
                <Modal.Separator />
                <Modal.Content className="flex items-center justify-end space-x-2">
                  <Button
                    type="default"
                    disabled={isCreating}
                    onClick={() => setShowAddKeyModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button htmlType="submit" disabled={isCreating} loading={isCreating}>
                    Add key
                  </Button>
                </Modal.Content>
              </>
            )
          }}
        </Form>
      </Modal>
    </>
  )
}
