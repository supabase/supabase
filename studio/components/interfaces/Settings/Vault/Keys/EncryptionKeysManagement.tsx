import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { Fragment, useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Form,
  IconExternalLink,
  IconKey,
  IconLoader,
  IconSearch,
  IconTrash,
  IconX,
  Input,
  Listbox,
  Modal,
} from 'ui'

import Divider from 'components/ui/Divider'
import { useCheckPermissions, useStore } from 'hooks'

const DEFAULT_KEY_NAME = 'No description provided'

const EncryptionKeysManagement = () => {
  const { vault, ui } = useStore()
  const { id } = useParams()

  const [searchValue, setSearchValue] = useState<string>('')
  const [selectedSort, setSelectedSort] = useState<'name' | 'created'>('created')
  const [showAddKeyModal, setShowAddKeyModal] = useState(false)
  const [selectedKeyToRemove, setSelectedKeyToRemove] = useState<any>()
  const [isDeletingKey, setIsDeletingKey] = useState(false)

  const canManageKeys = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'tables')

  useEffect(() => {
    if (id !== undefined) setSearchValue(id)
  }, [id])

  const keys = (
    searchValue
      ? vault.listKeys(
          (key: any) =>
            (key?.name ?? '').toLowerCase().includes(searchValue.toLowerCase()) ||
            key.id.toLowerCase().includes(searchValue.toLowerCase())
        )
      : vault.listKeys()
  ).sort((a: any, b: any) => {
    if (selectedSort === 'created') {
      return Number(new Date(a.created)) - Number(new Date(b.created))
    } else {
      return a[selectedSort] > b[selectedSort] ? 1 : -1
    }
  })

  const addKey = async (values: any, { setSubmitting }: any) => {
    setSubmitting(true)
    const res = await vault.addKey(values.name)
    if (!res.error) {
      ui.setNotification({ category: 'success', message: 'Successfully added new key' })
      setShowAddKeyModal(false)
    } else {
      ui.setNotification({
        error: res.error,
        category: 'error',
        message: `Failed to add new key: ${res.error.message}`,
      })
    }
    setSubmitting(false)
  }

  const confirmDeleteKey = async () => {
    if (!selectedKeyToRemove) return

    setIsDeletingKey(true)
    const res = await vault.deleteKey(selectedKeyToRemove.id)
    if (!res.error) {
      ui.setNotification({ category: 'success', message: `Successfully deleted encryption key` })
      setSelectedKeyToRemove(undefined)
    } else {
      ui.setNotification({
        error: res.error,
        category: 'error',
        message: `Failed to delete encryption key: ${res.error.message}`,
      })
    }
    setIsDeletingKey(false)
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Input
              className="w-64 input-clear"
              size="small"
              placeholder="Search by name or ID"
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
            <div className="w-32">
              <Listbox size="small" value={selectedSort} onChange={setSelectedSort}>
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
              <Tooltip.Trigger>
                <Button
                  type="primary"
                  disabled={!canManageKeys}
                  onClick={() => setShowAddKeyModal(true)}
                >
                  Add new key
                </Button>
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
                        You need additional permissions to add keys
                      </span>
                    </div>
                  </Tooltip.Content>
                </Tooltip.Portal>
              )}
            </Tooltip.Root>
          </div>
        </div>

        {/* Table of keys */}
        <div className="border rounded">
          {!vault.isLoaded ? (
            <div className="px-6 py-6 space-x-2 flex items-center justify-center">
              <IconLoader
                className="animate-spin text-foreground-light"
                size={16}
                strokeWidth={1.5}
              />
              <p className="text-sm text-foreground">Loading keys from the Vault</p>
            </div>
          ) : (
            <>
              {keys.map((key, idx) => {
                return (
                  <Fragment key={key.key_id}>
                    <div className="px-6 py-4 flex items-center space-x-4">
                      <IconKey className="text-foreground-light" strokeWidth={2} />
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
                          <Tooltip.Trigger>
                            <Button
                              type="default"
                              className="py-2"
                              icon={<IconTrash />}
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
                    {idx !== keys.length - 1 && <Divider light />}
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
        loading={isDeletingKey}
        header={<h5 className="text-sm text-foreground">Confirm to delete key</h5>}
      >
        <div className="py-4">
          <Modal.Content>
            <div className="space-y-4">
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
            </div>
          </Modal.Content>
        </div>
      </Modal>

      <Modal
        closable
        hideFooter
        size="medium"
        visible={showAddKeyModal}
        onCancel={() => setShowAddKeyModal(false)}
        header={<h5 className="text-sm text-foreground">Add a new key</h5>}
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
          {({ isSubmitting }: any) => {
            return (
              <div className="py-4">
                <Modal.Content>
                  <p className="text-sm mb-4">
                    Provide a name for your key for easier identification.
                  </p>
                  <div className="space-y-4 pb-4">
                    <Input id="name" label="Key Name" />
                  </div>
                </Modal.Content>
                <Modal.Separator />
                <Modal.Content>
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      type="default"
                      disabled={isSubmitting}
                      onClick={() => setShowAddKeyModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button htmlType="submit" disabled={isSubmitting} loading={isSubmitting}>
                      Add key
                    </Button>
                  </div>
                </Modal.Content>
              </div>
            )
          }}
        </Form>
      </Modal>
    </>
  )
}

export default observer(EncryptionKeysManagement)
