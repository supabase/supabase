import { ReactNode, useState } from 'react'

import { useTableUpdateMutation } from 'data/tables/table-update-mutation'
import type { ResponseError } from 'types'
import { Button, type ButtonProps } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

export type ToggleRlsButtonChildProps = {
  onClick: () => void
  isRlsEnabled: boolean
  isLoading: boolean
  disabled: boolean
}

type ToggleRlsButtonBaseProps = {
  tableId: number
  schema: string
  tableName: string
  /**
   * Whether RLS is enabled before the action is taken.
   */
  isRlsEnabled: boolean

  disabled?: boolean
  showDefaultConfirmModal?: boolean

  projectRef: string
  connectionString: string | null

  onSuccess?: (nextIsEnabled: boolean) => void
  onError?: (error: ResponseError) => void
  onSettled?: () => void
}

type ToggleRlsButtonDefaultProps = ToggleRlsButtonBaseProps &
  Omit<
    ButtonProps,
    'children' | 'asChild' | 'onClick' | 'disabled' | 'onError' | 'onSuccess' | 'onSettled'
  >

type ToggleRlsButtonCustomChildProps = ToggleRlsButtonBaseProps & {
  asChild: true
  children: (props: ToggleRlsButtonChildProps) => ReactNode
}

export type ToggleRlsButtonProps = ToggleRlsButtonDefaultProps | ToggleRlsButtonCustomChildProps

export const ToggleRlsButton = (props: ToggleRlsButtonProps): ReactNode => {
  const {
    // Query information
    tableId,
    schema,
    tableName,
    isRlsEnabled,

    // UI state
    disabled = false,
    showDefaultConfirmModal = true,

    // Database connection information
    projectRef,
    connectionString,

    // Callbacks
    onSuccess,
    onError,
    onSettled,

    ...restProps
  } = props

  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false)
  const closeConfirmationModal = () => setIsConfirmationModalVisible(false)

  const nextIsEnabled = !isRlsEnabled

  const { mutate: updateTable, isLoading } = useTableUpdateMutation()

  const handleUpdate = () => {
    updateTable(
      {
        id: tableId,
        projectRef,
        connectionString,
        schema,
        name: tableName,
        payload: { rls_enabled: nextIsEnabled },
      },
      {
        onSuccess: () => onSuccess?.(nextIsEnabled),
        onError: (error) => onError?.(error),
        onSettled: () => {
          if (showDefaultConfirmModal) closeConfirmationModal()
          onSettled?.()
        },
      }
    )
  }

  const handleClick = () => {
    if (isLoading || disabled) return
    if (showDefaultConfirmModal) {
      return setIsConfirmationModalVisible(true)
    }
    handleUpdate()
  }

  const action = nextIsEnabled ? 'enable' : 'disable'
  const confirmModal = showDefaultConfirmModal ? (
    <ConfirmationModal
      visible={isConfirmationModalVisible}
      loading={isLoading}
      title={`Confirm to ${action} Row Level Security`}
      description={`Are you sure you want to ${action} Row Level Security for this table?`}
      confirmLabel={nextIsEnabled ? 'Enable RLS' : 'Disable RLS'}
      onCancel={closeConfirmationModal}
      onConfirm={handleUpdate}
    />
  ) : null

  if ('asChild' in props) {
    const child = props.children({
      onClick: handleClick,
      isRlsEnabled,
      isLoading,
      disabled,
    })

    return (
      <>
        {child}
        {confirmModal}
      </>
    )
  }

  return (
    <>
      <Button {...restProps} loading={isLoading} disabled={disabled} onClick={handleClick}>
        {nextIsEnabled ? 'Enable RLS' : 'Disable RLS'}
      </Button>
      {confirmModal}
    </>
  )
}
