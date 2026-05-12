import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronUp, MoreVertical, Trash } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  cn,
  Collapsible,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Form,
  FormControl,
  FormField,
  Switch,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { ROLE_PERMISSIONS } from './Roles.constants'
import { useDatabaseRoleUpdateMutation } from '@/data/database-roles/database-role-update-mutation'
import type { PgRole } from '@/data/database-roles/database-roles-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface RoleRowProps {
  role: PgRole
  disabled?: boolean
  onSelectDelete: (role: string) => void
}

const permissionSchema = z.boolean().optional()
const formSchema = z.object(
  Object.keys(ROLE_PERMISSIONS).reduce(
    (acc, key) => ({
      ...acc,
      [key]: permissionSchema,
    }),
    {} as Record<keyof typeof ROLE_PERMISSIONS, z.ZodBoolean>
  )
)

export const RoleRow = ({ role, disabled = false, onSelectDelete }: RoleRowProps) => {
  const { data: project } = useSelectedProjectQuery()
  const [isExpanded, setIsExpanded] = useState(false)
  const { mutate: updateDatabaseRole, isPending: isUpdating } = useDatabaseRoleUpdateMutation()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: role,
  })

  const { reset, formState } = form
  const { isDirty } = formState

  useEffect(() => {
    reset(role)
  }, [role, reset])

  const onSaveChanges: SubmitHandler<z.infer<typeof formSchema>> = async (values) => {
    if (!project) return console.error('Project is required')

    const changed = Object.fromEntries(
      Object.entries(values).filter(([k, v]) => {
        const key = k as keyof PgRole
        return v !== role[key]
      })
    )

    if (Object.keys(changed).length === 0) {
      // No actual changes to persist; avoid sending an empty update payload
      reset(role)
      return
    }

    updateDatabaseRole(
      {
        projectRef: project.ref,
        connectionString: project.connectionString,
        id: role.id,
        payload: changed,
      },
      {
        onSuccess: () => {
          toast.success(`Successfully updated role "${role.name}"`)
          reset(values)
        },
      }
    )
  }

  const formId = `role-update-form-${role.id}`

  return (
    <Collapsible
      open={isExpanded}
      className={cn(
        'bg-surface-100',
        'hover:bg-overlay-hover',
        'data-open:bg-selection',
        'border-default hover:border-strong',
        'data-open:border-strong',
        'data-open:pb-px col-span-12 mx-auto',
        '-space-y-px overflow-hidden',
        'border border-t-0 first:border-t first:mt-0! hover:border-t hover:-mt-px shadow-sm transition hover:z-50',
        'first:rounded-tl first:rounded-tr',
        'last:rounded-bl last:rounded-br'
      )}
    >
      <div className={cn('flex items-center relative', !disabled && 'pr-(--card-padding-x)')}>
        <Collapsible.Trigger asChild>
          <button
            id={`collapsible-trigger-${role.id}`}
            type="button"
            className="group flex w-full items-center justify-between rounded-sm py-3 px-card text-foreground"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
          >
            <div className="flex items-start space-x-3">
              <ChevronUp
                className="text-border-stronger transition data-open-parent:rotate-0 data-closed-parent:rotate-180"
                strokeWidth={2}
                width={14}
              />
              <div className="space-x-2 flex items-center">
                <p className="text-left text-sm">{role.name}</p>
                <p className="text-left text-sm text-foreground-light">(ID: {role.id})</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {role.activeConnections > 0 && (
                <div className="relative h-2 w-2">
                  <span className="flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-brand opacity-75"></span>
                  </span>
                </div>
              )}
              <p
                className={cn(
                  `text-sm`,
                  role.activeConnections > 0 ? 'text-foreground' : 'text-foreground-light'
                )}
              >
                {role.activeConnections} connections
              </p>
            </div>
          </button>
        </Collapsible.Trigger>
        {!disabled && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="default"
                className="px-1"
                icon={<MoreVertical />}
                aria-label={`${role.name} actions`}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="end" className="w-[120px]">
              <DropdownMenuItem
                className="space-x-2"
                onClick={(event) => {
                  event.stopPropagation()
                  onSelectDelete(role.id.toString())
                }}
              >
                <Trash className="text-red-800" size="14" strokeWidth={2} />
                <p>Delete</p>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <Collapsible.Content>
        <Form {...form}>
          <form
            id={formId}
            onSubmit={form.handleSubmit(onSaveChanges)}
            className="group border-t border-default bg-surface-100 py-6 px-5 md:px-20 text-foreground"
          >
            <div className="py-4 space-y-[9px]">
              {(Object.keys(ROLE_PERMISSIONS) as (keyof typeof ROLE_PERMISSIONS)[]).map(
                (permission) => (
                  <FormField
                    key={permission}
                    control={form.control}
                    name={permission}
                    disabled={disabled || ROLE_PERMISSIONS[permission].disabled}
                    render={({ field }) => (
                      <FormItemLayout
                        id={`${role.id}-${permission}`}
                        layout="flex"
                        label={ROLE_PERMISSIONS[permission].description}
                      >
                        <FormControl>
                          <Switch
                            id={`${role.id}-${permission}`}
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={disabled || ROLE_PERMISSIONS[permission].disabled}
                          />
                        </FormControl>
                      </FormItemLayout>
                    )}
                  />
                )
              )}
            </div>
            {!disabled && (
              <div className="py-4 flex items-center space-x-2 justify-end">
                <Button type="default" disabled={!isDirty || isUpdating} onClick={() => reset()}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={!isDirty || isUpdating}
                  loading={isUpdating}
                >
                  Save
                </Button>
              </div>
            )}
          </form>
        </Form>
      </Collapsible.Content>
    </Collapsible>
  )
}
