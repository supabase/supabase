import { FC, useState, useRef } from 'react'
import { PostgresRole } from '@supabase/postgres-meta'
import {
  Button,
  Form,
  Dropdown,
  IconChevronUp,
  IconCheck,
  IconX,
  Collapsible,
  IconEdit3,
  IconTrash,
  IconMoreVertical,
  Checkbox,
} from 'ui'

interface Props {
  role: PostgresRole
}

const ROLE_PERMISSIONS: any = {
  is_superuser: 'User is a Superuser',
  can_login: 'User can login',
  can_create_role: 'User can create roles',
  can_create_db: 'User can create databases',
  is_replication_role:
    'User can initiate streaming replication and put the system in and out of backup mode',
  can_bypass_rls: 'User bypasses every row level security policy',
}

const RoleRow: FC<Props> = ({ role }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isEditingRef = useRef<boolean>()

  const {
    is_superuser,
    can_login,
    can_create_role,
    can_create_db,
    is_replication_role,
    can_bypass_rls,
  } = role

  const onSelectEdit = (event: any) => {
    event.stopPropagation()
    setIsExpanded(true)
    setIsEditing(true)
    isEditingRef.current = true
  }

  const onCancelEdit = (event: any) => {
    event.stopPropagation()
    setIsEditing(false)
    isEditingRef.current = false
  }

  const onSaveChanges = async (values: any) => {
    setIsSaving(true)
    console.log(values)
    setIsSaving(false)
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
      {({ handleReset }: any) => (
        <Collapsible
          open={isExpanded}
          onOpenChange={() => {
            if (!isEditingRef.current) setIsExpanded(!isExpanded)
          }}
        >
          <Collapsible.Trigger asChild>
            <button
              type="button"
              className="group flex w-full items-center justify-between rounded py-3 px-6 text-scale-1200"
            >
              <div className="flex items-start space-x-3">
                <IconChevronUp
                  className="text-scale-800 transition data-open-parent:rotate-0 data-closed-parent:rotate-180"
                  strokeWidth={2}
                  width={14}
                />
                <div className="space-x-2 flex items-center">
                  <p className="text-left text-sm">{role.name}</p>
                  <p className="text-left text-sm text-scale-1000">(ID: {role.id})</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <p
                  className={`text-sm ${
                    role.active_connections > 0 ? 'text-scale-1100' : 'text-scale-1000'
                  }`}
                >
                  {role.active_connections} connections
                </p>
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <Button
                      type="default"
                      disabled={isSaving}
                      onClick={(event) => {
                        handleReset()
                        onCancelEdit(event)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="primary" disabled={isSaving} loading={isSaving} htmlType="submit">
                      Save changes
                    </Button>
                  </div>
                ) : (
                  <Dropdown
                    side="bottom"
                    className="w-[120px]"
                    overlay={
                      <>
                        <Dropdown.Item
                          icon={<IconEdit3 size="tiny" strokeWidth={2} />}
                          onClick={onSelectEdit}
                        >
                          Edit
                        </Dropdown.Item>
                        <Dropdown.Separator />
                        <Dropdown.Item
                          icon={<IconTrash className="text-red-800" size="tiny" strokeWidth={2} />}
                          onClick={() => setIsDeleting(true)}
                        >
                          Delete
                        </Dropdown.Item>
                      </>
                    }
                  >
                    <Button as="span" type="default" className="px-1" icon={<IconMoreVertical />} />
                  </Dropdown>
                )}
              </div>
            </button>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <div className="group border-t border-scale-500 bg-scale-100 py-6 px-6 text-scale-1200 dark:bg-scale-300">
              {isEditing ? (
                <div className="mx-auto py-4 px-6 space-y-[9px]">
                  {Object.keys(ROLE_PERMISSIONS).map((permission) => (
                    <Checkbox
                      key={permission}
                      id={permission}
                      name={permission}
                      label={ROLE_PERMISSIONS[permission]}
                    />
                  ))}
                </div>
              ) : (
                <div className="mx-auto py-4 px-6 space-y-2">
                  {Object.keys(ROLE_PERMISSIONS).map((permission) => (
                    <div key={permission} className="flex items-center space-x-2">
                      {(role as any)[permission] ? (
                        <IconCheck className="text-brand-900" strokeWidth={2} />
                      ) : (
                        <IconX className="text-scale-1000" strokeWidth={2} />
                      )}
                      <p className="text-sm">{ROLE_PERMISSIONS[permission]}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Collapsible.Content>
        </Collapsible>
      )}
    </Form>
  )
}

export default RoleRow
