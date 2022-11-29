import { FC, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Badge, IconLoader, Toggle } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { checkPermissions, useStore } from 'hooks'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'
import EnableExtensionModal from './EnableExtensionModal'

interface Props {
  extension: any
}

const ExtensionCard: FC<Props> = ({ extension }) => {
  const { ui, meta } = useStore()

  const isOn = extension.installed_version !== null
  const [loading, setLoading] = useState(false)
  const [showConfirmEnableModal, setShowConfirmEnableModal] = useState(false)

  const canUpdateExtensions = checkPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'extensions'
  )

  async function enableExtension() {
    return setShowConfirmEnableModal(true)
  }

  async function disableExtension() {
    confirmAlert({
      title: 'Confirm to disable extension',
      message: `Are you sure you want to turn OFF "${extension.name}" extension?`,
      onAsyncConfirm: async () => {
        try {
          setLoading(true)
          const response: any = await meta.extensions.del(extension.name)
          if (response.error) {
            throw response.error
          } else {
            ui.setNotification({
              category: 'success',
              message: `${extension.name.toUpperCase()} is off.`,
            })
          }
        } catch (error: any) {
          ui.setNotification({
            category: 'error',
            message: `Toggle ${extension.name.toUpperCase()} failed: ${error.message}`,
          })
        } finally {
          // Need to reload them because the delete function
          // removes the extension from the store
          meta.extensions.load()
          setLoading(false)
        }
      },
    })
  }

  return (
    <>
      <div
        className={[
          'flex border-panel-border-light dark:border-panel-border-dark',
          'flex-col overflow-hidden rounded border shadow-sm',
        ].join(' ')}
      >
        <div
          className={[
            'border-panel-border-light bg-panel-header-light dark:bg-panel-header-dark',
            'flex border-b p-4 px-6 dark:border-panel-border-dark',
          ].join(' ')}
        >
          <h3
            title={extension.name}
            className="m-0 h-5 flex-1 truncate text-base uppercase text-scale-1200"
          >
            {extension.name}
          </h3>
          {loading ? (
            <IconLoader className="animate-spin" size={16} />
          ) : (
            <Toggle
              size="tiny"
              checked={isOn}
              disabled={!canUpdateExtensions}
              onChange={() => (isOn ? disableExtension() : enableExtension())}
            />
          )}
        </div>
        <div
          className={[
            'bg-panel-header-light dark:bg-panel-header-dark',
            'bg-panel-secondary-light dark:bg-panel-secondary-dark flex h-full flex-col justify-between',
          ].join(' ')}
        >
          <div className="p-4 px-6">
            <p className="text-sm text-scale-1100 capitalize-sentence">{extension.comment}</p>
          </div>
          {isOn && extension.schema && (
            <div className="p-4 px-6">
              <div className="flex flex-grow items-center space-x-2 text-sm text-scale-1100">
                <span>Schema:</span>
                <Badge>{`${extension.schema}`}</Badge>
              </div>
            </div>
          )}
        </div>
      </div>
      <EnableExtensionModal
        visible={showConfirmEnableModal}
        extension={extension}
        onCancel={() => setShowConfirmEnableModal(false)}
      />
    </>
  )
}

export default observer(ExtensionCard)
