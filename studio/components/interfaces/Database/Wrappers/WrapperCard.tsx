import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { IconLoader, Toggle } from 'ui'

import { confirmAlert } from 'components/to-be-cleaned/ModalsDeprecated/ConfirmModal'
import { checkPermissions, useStore } from 'hooks'
import { Wrapper } from './types'
import WrapperEditor from './WrapperEditor'
import { useFDWDeleteMutation } from 'data/fdw/fdw-delete-mutation'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import Image from 'next/image'

// [Joshen TODO]  No longer used, can remove after WrapperRow is working

export type WrapperCardProps = {
  wrapper: Wrapper
  enabled?: boolean
}

const WrapperCard = ({ wrapper, enabled = false }: WrapperCardProps) => {
  const { project } = useProjectContext()
  const { ui } = useStore()

  const canUpdateWrappers = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'wrappers')

  const [isEditorVisible, setIsEditorVisible] = useState(false)

  const { mutateAsync: deleteFDW, isLoading } = useFDWDeleteMutation()

  async function enableWrapper() {
    setIsEditorVisible(true)
  }

  async function disableWrapper() {
    confirmAlert({
      title: 'Confirm to disable wrapper',
      message: `Are you sure you want to turn OFF "${wrapper.name}" wrapper? This will also delete ALL tables created with this wrapper.`,
      onAsyncConfirm: async () => {
        try {
          await deleteFDW({
            projectRef: project?.ref,
            connectionString: project?.connectionString,
            name: wrapper.name,
          })
        } catch (error: any) {
          ui.setNotification({
            category: 'error',
            message: `Disabling ${wrapper.name} failed: ${error.message}`,
          })
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
            'flex justify-between border-b p-4 px-6 dark:border-panel-border-dark',
          ].join(' ')}
        >
          <div className="flex items-center space-x-3">
            <Image src={wrapper.icon} height={20} width={20} />
            <h3
              title={wrapper.label}
              className="flex-1 h-5 m-0 text-base uppercase truncate text-scale-1200 capitalize"
            >
              {wrapper.label}
            </h3>
          </div>
          {isLoading ? (
            <IconLoader className="animate-spin" size={16} />
          ) : (
            <Toggle
              size="tiny"
              checked={enabled}
              disabled={!canUpdateWrappers}
              onChange={() => (enabled ? disableWrapper() : enableWrapper())}
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
