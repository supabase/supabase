import { ChevronDown, RotateCcw, X } from 'lucide-react'
import { useFieldArray, useFormState } from 'react-hook-form'
import {
  Button,
  Checkbox,
  FormControl,
  FormField,
  FormMessage,
  Popover,
  PopoverContent,
  PopoverTrigger,
  WarningIcon,
} from 'ui'

import { TokenFormValues } from '../../../AccessToken.schemas'
import { PermissionResourceSelector } from './PermissionResourceSelector'
import { PermissionsProps } from './Permissions.types'
import { sortActions } from './Permissions.utils'
import { ACCESS_TOKEN_RESOURCES } from '@/components/interfaces/Account/AccessTokens/AccessToken.constants'
import { formatAccessText } from '@/components/interfaces/Account/AccessTokens/AccessToken.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'

export const Permissions = ({
  control,
  resourceSearchOpen,
  setResourceSearchOpen,
}: PermissionsProps) => {
  const {
    fields: permissionRows,
    append,
    remove,
  } = useFieldArray<TokenFormValues>({
    name: 'permissionRows',
    control,
  })
  const { errors } = useFormState({ control, name: 'permissionRows' })

  return (
    <div className="space-y-4 px-5 sm:px-6 py-6">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm">Configure permissions</span>
          <div className="flex items-center gap-2">
            {permissionRows.length > 0 && (
              <ButtonTooltip
                variant="default"
                size="tiny"
                className="p-1"
                onClick={() => remove()}
                icon={<RotateCcw size={16} />}
                tooltip={{
                  content: {
                    side: 'top',
                    align: 'center',
                    alignOffset: -10,
                    text: 'Reset all permissions',
                  },
                }}
              />
            )}
            <PermissionResourceSelector
              open={resourceSearchOpen}
              onOpenChange={setResourceSearchOpen}
              permissionRows={permissionRows}
              onResourceToggled={(resource) => {
                const index = permissionRows.findIndex((p) => p.resource === resource.resource)
                if (index > -1) {
                  return remove(index)
                }
                append(resource)
              }}
              align="end"
            />
          </div>
        </div>

        {permissionRows.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border rounded-lg">
            <p className="text-sm text-foreground-light">No permissions configured yet.</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg">
            {permissionRows.map((row, index) => {
              const selectedResource = ACCESS_TOKEN_RESOURCES.find(
                (r) => r.resource === row.resource
              )
              return (
                <FormField
                  key={row.id}
                  name={`permissionRows.${index}.actions`}
                  render={({ field, fieldState }) => {
                    const fieldValue = field.value || []

                    return (
                      <div>
                        <div className="flex items-center gap-3 p-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium truncate max-w-[36ch] capitalize">
                                  {selectedResource?.title}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedResource && (
                              <Popover>
                                <FormControl>
                                  <PopoverTrigger asChild>
                                    <Button
                                      id={`permissionRows.${index}.actions`}
                                      aria-describedby={
                                        fieldState.invalid
                                          ? `permissionRows.${index}.actions.error`
                                          : undefined
                                      }
                                      variant="default"
                                      size="tiny"
                                      className="w-[150px] flex text-sm justify-between h-7 "
                                      iconRight={
                                        <ChevronDown size={14} className="text-foreground-muted" />
                                      }
                                      ref={field.ref}
                                    >
                                      {fieldValue.length === 0 ? (
                                        <span className="text-foreground-lighter">
                                          Select access
                                        </span>
                                      ) : fieldValue.length === 1 ? (
                                        formatAccessText(fieldValue[0])
                                      ) : (
                                        `${fieldValue.length} selected`
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                </FormControl>
                                <PopoverContent className="w-[180px] p-2" align="end">
                                  <div className="space-y-2">
                                    {sortActions(selectedResource.actions).map((action) => (
                                      <label
                                        key={action}
                                        className="flex items-center gap-2 cursor-pointer"
                                      >
                                        <Checkbox
                                          checked={fieldValue.includes(action)}
                                          onCheckedChange={(checked) => {
                                            const newActions = checked
                                              ? [...fieldValue, action]
                                              : fieldValue.filter((a: string) => a !== action)
                                            field.onChange(newActions)
                                          }}
                                        />
                                        <span className="text-sm">{formatAccessText(action)}</span>
                                      </label>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                            <Button
                              variant="text"
                              size="tiny"
                              className="p-1"
                              onClick={() => {
                                remove(index)
                              }}
                              icon={<X size={16} />}
                              aria-label="Remove"
                            />
                          </div>
                        </div>
                        <div className="p-3 pt-0">
                          <FormMessage id={`permissionRows.${index}.actions.error`} />
                        </div>
                        {index < permissionRows.length - 1 && (
                          <div className="border-t border-border" />
                        )}
                      </div>
                    )
                  }}
                />
              )
            })}
          </div>
        )}
      </div>

      <div className="w-full flex gap-x-2 items-center">
        <WarningIcon />
        <span className="text-xs text-left text-foreground-lighter">
          Once you've set these permissions, you cannot edit them.
        </span>
      </div>
      {errors.permissionRows?.message || errors.permissionRows?.root?.message ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {errors.permissionRows?.message || errors.permissionRows?.root?.message}
        </p>
      ) : null}
    </div>
  )
}
