import { ACCESS_TOKEN_RESOURCES } from 'components/interfaces/Account/AccessTokens/AccessToken.constants'
import { formatAccessText } from 'components/interfaces/Account/AccessTokens/AccessToken.utils'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { ChevronDown, RotateCcw, X } from 'lucide-react'
import { Path, PathValue } from 'react-hook-form'
import {
  Button,
  Checkbox_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  WarningIcon,
} from 'ui'

import { PermissionResourceSelector } from './PermissionResourceSelector'
import { PermissionRow, PermissionsFormValues, PermissionsProps } from './Permissions.types'
import { sortActions } from './Permissions.utils'

export const Permissions = <TFormValues extends PermissionsFormValues = PermissionsFormValues>({
  setValue,
  watch,
  resourceSearchOpen,
  setResourceSearchOpen,
}: PermissionsProps<TFormValues>) => {
  const permissionRows = (watch('permissionRows' as Path<TFormValues>) || []) as PermissionRow[]

  return (
    <div className="space-y-4 px-5 sm:px-6 py-6">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm">Configure permissions</span>
          <div className="flex items-center gap-2">
            {permissionRows.length > 0 && (
              <ButtonTooltip
                type="default"
                size="tiny"
                className="p-1"
                onClick={() => {
                  setValue(
                    'permissionRows' as Path<TFormValues>,
                    [] as PathValue<TFormValues, Path<TFormValues>>
                  )
                }}
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
              setValue={setValue}
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
                <div key={row.resource ?? `resource-${index}`}>
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
                        <Popover_Shadcn_>
                          <PopoverTrigger_Shadcn_ asChild>
                            <Button
                              type="default"
                              size="tiny"
                              className="w-[150px] flex text-sm justify-between h-7 "
                              iconRight={
                                <ChevronDown size={14} className="text-foreground-muted" />
                              }
                            >
                              {row.actions.length === 0 ? (
                                <span className="text-foreground-lighter">Select access</span>
                              ) : row.actions.length === 1 ? (
                                formatAccessText(row.actions[0])
                              ) : (
                                `${row.actions.length} selected`
                              )}
                            </Button>
                          </PopoverTrigger_Shadcn_>
                          <PopoverContent_Shadcn_ className="w-[180px] p-2" align="end">
                            <div className="space-y-2">
                              {sortActions(selectedResource.actions).map((action) => (
                                <label
                                  key={action}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Checkbox_Shadcn_
                                    checked={row.actions.includes(action)}
                                    onCheckedChange={(checked) => {
                                      const newActions = checked
                                        ? [...row.actions, action]
                                        : row.actions.filter((a) => a !== action)
                                      const newRows: PermissionRow[] = permissionRows.map((r, i) =>
                                        i === index
                                          ? { resource: r.resource, actions: newActions }
                                          : r
                                      )
                                      setValue(
                                        'permissionRows' as Path<TFormValues>,
                                        newRows as PathValue<TFormValues, Path<TFormValues>>,
                                        { shouldValidate: true, shouldDirty: true }
                                      )
                                    }}
                                  />
                                  <span className="text-sm">{formatAccessText(action)}</span>
                                </label>
                              ))}
                            </div>
                          </PopoverContent_Shadcn_>
                        </Popover_Shadcn_>
                      )}
                      <Button
                        type="text"
                        size="tiny"
                        className="p-1"
                        onClick={() => {
                          const newRows = permissionRows.filter((_, i) => i !== index)
                          setValue(
                            'permissionRows' as Path<TFormValues>,
                            newRows as PathValue<TFormValues, Path<TFormValues>>,
                            { shouldValidate: true, shouldDirty: true }
                          )
                        }}
                        icon={<X size={16} />}
                      />
                    </div>
                  </div>
                  {index < permissionRows.length - 1 && <div className="border-t border-border" />}
                </div>
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
    </div>
  )
}
