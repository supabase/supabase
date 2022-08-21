import { FC, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Badge, IconLoader, Toggle } from '@supabase/ui'

import { useStore } from 'hooks'
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
          'border-panel-border-light dark:border-panel-border-dark flex',
          'flex-col overflow-hidden rounded border shadow-sm',
        ].join(' ')}
      >
        <div
          className={[
            'bg-panel-header-light dark:bg-panel-header-dark border-panel-border-light',
            'dark:border-panel-border-dark flex border-b p-4 px-6',
          ].join(' ')}
        >
          <h3
            title={extension.name}
            className="text-scale-1200 m-0 h-5 flex-1 truncate text-base uppercase"
          >
            {extension.name}
          </h3>
          {loading ? (
            <IconLoader className="animate-spin" size={16} />
          ) : (
            <Toggle
              size="tiny"
              checked={isOn}
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
            <p className="text-scale-1100 text-sm">
              <span className="flex-grow capitalize">{extension.comment}</span>
            </p>
          </div>
          {isOn && extension.schema && (
            <div className="p-4 px-6">
              <div className="text-scale-1100 text-sm flex-grow space-x-2 flex items-center">
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
