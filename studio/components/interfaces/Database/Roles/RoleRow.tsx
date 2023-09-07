import * as Tooltip from '@radix-ui/react-tooltip'
import { PostgresRole } from '@supabase/postgres-meta'
import { useState } from 'react'
import {
  Button,
  Collapsible,
  Dropdown,
  Form,
  IconChevronUp,
  IconHelpCircle,
  IconMoreVertical,
  IconTrash,
  Toggle,
} from 'ui'

import { useStore } from 'hooks'
import { ROLE_PERMISSIONS } from './Roles.constants'

interface RoleRowProps {
  role: PostgresRole
  disabled?: boolean
  onSelectDelete: (role: PostgresRole) => void
}

const RoleRow = ({ role, disabled = false, onSelectDelete }: RoleRowProps) => {
  const { ui, meta } = useStore()
  const [isExpanded, setIsExpanded] = useState(false)

  const {
    is_superuser,
    can_login,
    can_create_role,
    can_create_db,
    is_replication_role,
    can_bypass_rls,
  } = role

  const onSaveChanges = async (values: any, { setSubmitting, resetForm }: any) => {
    setSubmitting(true)
    const { is_superuser, is_replication_role, ...payload } = values
    const res = await meta.roles.update(role.id, payload)
    setSubmitting(false)

    if (res.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to update role "${role.name}": ${res.error.message}`,
      })
    } else {
      ui.setNotification({
        category: 'success',
        message: `Successfully updated role "${role.name}"`,
      })
      resetForm({ values: { ...values }, initialValues: { ...values } })
    }
  }

  return (
    <Form
      name="role-update-form"
      initialValues={{
        is_superuser,
        can_login,
        can_create_role,
        can_create_db,
        is_replication_role,
        can_bypass_rls,
      }}
      onSubmit={onSaveChanges}
      className={[
        'bg-scale-100 dark:bg-scale-300',
        'hover:bg-scale-200 dark:hover:bg-scale-500',
        'data-open:bg-scale-200 dark:data-open:bg-scale-500',
        'border-scale-300 dark:border-scale-500 hover:border-scale-500',
        'dark:hover:border-scale-700 data-open:border-scale-700',
        'data-open:pb-px col-span-12 mx-auto',
        '-space-y-px overflow-hidden',
        'border border-t-0 first:border-t first:!mt-0 hover:border-t hover:-mt-[1px] shadow transition hover:z-50',
        'first:rounded-tl first:rounded-tr',
        'last:rounded-bl last:rounded-br',
      ].join(' ')}
    >
      {({ values, initialValues, handleReset, isSubmitting }: any) => {
        const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)

        return (
          <Collapsible open={isExpanded}>
            <Collapsible.Trigger asChild>
              <button
                id="collapsible-trigger"
                type="button"
                className="group flex w-full items-center justify-between rounded py-3 px-6 text-scale-1200"
                onClick={(event: any) => {
                  if (event.target.id === 'collapsible-trigger') setIsExpanded(!isExpanded)
                }}
              >
                <div className="flex items-start space-x-3">
                  <IconChevronUp
                    id="collapsible-trigger"
                    className="text-scale-800 transition data-open-parent:rotate-0 data-closed-parent:rotate-180"
                    strokeWidth={2}
                    width={14}
                  />
                  <div className="space-x-2 flex items-center">
                    <p className="text-left text-sm" id="collapsible-trigger">
                      {role.name}
                    </p>
                    <p className="text-left text-sm text-scale-1000" id="collapsible-trigger">
                      (ID: {role.id})
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {role.active_connections > 0 && (
                    <div className="relative h-2 w-2">
                      <span className="flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand opacity-75"></span>
                      </span>
                    </div>
                  )}
                  <p
                    id="collapsible-trigger"
                    className={`text-sm ${
                      role.active_connections > 0 ? 'text-scale-1100' : 'text-scale-1000'
                    }`}
                  >
                    {role.active_connections} connections
                  </p>
                  {!disabled && (
                    <Dropdown
                      side="bottom"
                      className="w-[120px]"
                      overlay={
                        <>
                          <Dropdown.Item
                            icon={
                              <IconTrash className="text-red-800" size="tiny" strokeWidth={2} />
                            }
                            onClick={(event: any) => {
                              event.stopPropagation()
                              onSelectDelete(role)
                            }}
                          >
                            Delete
                          </Dropdown.Item>
                        </>
                      }
                    >
                      <Button asChild type="default" className="px-1" icon={<IconMoreVertical />}>
                        <span></span>
                      </Button>
                    </Dropdown>
                  )}
                </div>
              </button>
            </Collapsible.Trigger>
            <Collapsible.Content>
              <div className="group border-t border-scale-500 bg-scale-100 py-6 px-20 text-scale-1200 dark:bg-scale-300">
                <div className="py-4 space-y-[9px]">
                  {Object.keys(ROLE_PERMISSIONS).map((permission) => (
                    <Toggle
                      size="small"
                      key={permission}
                      id={permission}
                      name={permission}
                      label={ROLE_PERMISSIONS[permission].description}
                      disabled={disabled || ROLE_PERMISSIONS[permission].disabled}
                      className={[
                        'roles-toggle',
                        disabled || ROLE_PERMISSIONS[permission].disabled ? 'opacity-50' : '',
                      ].join(' ')}
                      afterLabel={
                        !disabled &&
                        ROLE_PERMISSIONS[permission].disabled && (
                          <Tooltip.Root delayDuration={0}>
                            <Tooltip.Trigger type="button">
                              <IconHelpCircle
                                size="tiny"
                                strokeWidth={2}
                                className="ml-2 relative top-[3px]"
                              />
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content align="center" side="bottom">
                                <Tooltip.Arrow className="radix-tooltip-arrow" />
                                <div
                                  className={[
                                    'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                                    'border border-scale-200 space-y-1',
                                  ].join(' ')}
                                >
                                  <span className="text-xs">
                                    This privilege cannot be updated via the dashboard
                                  </span>
                                </div>
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        )
                      }
                    />
                  ))}
                </div>
                {!disabled && (
                  <div className="py-4 flex items-center space-x-2 justify-end">
                    <Button
                      type="default"
                      disabled={!hasChanges || isSubmitting}
                      onClick={() => handleReset()}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      disabled={!hasChanges || isSubmitting}
                      loading={isSubmitting}
                    >
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </Collapsible.Content>
          </Collapsible>
        )
      }}
    </Form>
  )
}

export default RoleRow
