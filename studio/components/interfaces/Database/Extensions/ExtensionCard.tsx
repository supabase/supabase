import { FC, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Badge, Toggle } from '@supabase/ui'

import { useStore } from 'hooks'
import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'

interface Props {
  extension: any
}

const ExtensionCard: FC<Props> = ({ extension }) => {
  const { ui, meta } = useStore()

  const isOn = extension.installed_version !== null
  const [loading, setLoading] = useState(false)

  async function enableExtension() {
    confirmAlert({
      title: 'Confirm to turn on',
      message: `Are you sure you want to turn ON "${extension.name}" extension?`,
      onAsyncConfirm: async () => {
        try {
          setLoading(true)
          const response = await meta.extensions.create({
            name: extension.name,
            schema: 'extensions',
            version: extension.default_version,
            cascade: true,
          })
          if (response.error) {
            throw response.error
          } else {
            ui.setNotification({
              category: 'success',
              message: `${extension.name.toUpperCase()} is on.`,
            })
          }
        } catch (error: any) {
          ui.setNotification({
            category: 'error',
            message: `Failed to toggle ${extension.name.toUpperCase()}: ${error.message}`,
          })
        } finally {
          setLoading(false)
        }
      },
    })
  }

  async function disableExtension() {
    confirmAlert({
      title: 'Confirm to turn off',
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
    <div
      className="
        border border-panel-border-light dark:border-panel-border-dark
        shadow-sm
        overflow-hidden
        rounded
        flex flex-col
      "
    >
      <div
        className="
          p-4 px-6 flex 
          bg-panel-header-light dark:bg-panel-header-dark
          border-b border-panel-border-light dark:border-panel-border-dark
        "
      >
        <h3 className="m-0 h-5 uppercase flex-1 truncate text-base text-scale-1200 truncate">
          {extension.name}
        </h3>
        {loading ? (
          <img className="loading-spinner" src="/img/spinner.gif"></img>
        ) : (
          <Toggle
            size="tiny"
            checked={isOn}
            onChange={() => (isOn ? disableExtension() : enableExtension())}
          />
        )}
      </div>
      <div
        className="
        bg-panel-header-light dark:bg-panel-header-dark
          bg-panel-secondary-light dark:bg-panel-secondary-dark 
          flex flex-col h-full"
      >
        <div className="p-4 px-6">
          <p className="text-sm text-scale-1100">
            <span className="flex-grow capitalize">{extension.comment}</span>
          </p>
        </div>
        {isOn && extension.schema && (
          <div className="p-4 px-6">
            <p className="text-sm text-scale-1100">
              <span className="flex-grow">
                Schema: <Badge>{`${extension.schema}`}</Badge>
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default observer(ExtensionCard)
