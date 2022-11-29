import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { IconLoader, Toggle } from 'ui'

import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'
import { checkPermissions, useStore } from 'hooks'
import { Wrapper } from './types'
import WrapperEditor from './WrapperEditor'

export type WrapperCardProps = {
  wrapper: Wrapper
}

const WrapperCard = ({ wrapper }: WrapperCardProps) => {
  const { ui } = useStore()

  const isOn = false
  const [loading, setLoading] = useState(false)

  const canUpdateWrappers = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'wrappers')

  const [isEditorVisible, setIsEditorVisible] = useState(false)

  async function enableWrapper() {
    setIsEditorVisible(true)
  }

  async function disableWrapper() {
    confirmAlert({
      title: 'Confirm to disable wrapper',
      message: `Are you sure you want to turn OFF "${wrapper.name}" wrapper?`,
      onAsyncConfirm: async () => {
        try {
          setLoading(true)
          // const response: any = await meta.wrappers.del(wrapper.name)
          // if (response.error) {
          //   throw response.error
          // } else {
          //   ui.setNotification({
          //     category: 'success',
          //     message: `${wrapper.name.toUpperCase()} is off.`,
          //   })
          // }
        } catch (error: any) {
          ui.setNotification({
            category: 'error',
            message: `Toggle ${wrapper.name.toUpperCase()} failed: ${error.message}`,
          })
        } finally {
          // Need to reload them because the delete function
          // removes the wrapper from the store
          // meta.wrappers.load()
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
            title={wrapper.label}
            className="flex-1 h-5 m-0 text-base uppercase truncate text-scale-1200"
          >
            {wrapper.label}
          </h3>
          {loading ? (
            <IconLoader className="animate-spin" size={16} />
          ) : (
            <Toggle
              size="tiny"
              checked={isOn}
              disabled={!canUpdateWrappers}
              onChange={() => (isOn ? disableWrapper() : enableWrapper())}
            />
          )}
        </div>
      </div>

      <WrapperEditor
        visible={isEditorVisible}
        wrapper={wrapper}
        onCancel={() => setIsEditorVisible(false)}
      />
    </>
  )
}

export default observer(WrapperCard)
