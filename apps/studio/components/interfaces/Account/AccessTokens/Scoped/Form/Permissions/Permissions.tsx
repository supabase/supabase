import { Path, PathValue } from 'react-hook-form'
import {
  Button,
  Select_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  WarningIcon,
} from 'ui'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { X, RotateCcw } from 'lucide-react'
import { ACCESS_TOKEN_RESOURCES } from '../../../AccessToken.constants'
import { PermissionRow, PermissionsFormValues, PermissionsProps } from './Permissions.types'
import { sortActions } from './Permissions.utils'
import { formatAccessText } from '../../../AccessToken.utils'
import { PermissionResourceSelector } from './PermissionResourceSelector'

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
                <div key={index}>
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
                        <Select_Shadcn_
                          value={row.action}
                          onValueChange={(value) => {
                            const newRows: PermissionRow[] = permissionRows.map((r, i) =>
                              i === index ? { resource: r.resource, action: value } : r
                            )
                            setValue(
                              'permissionRows' as Path<TFormValues>,
                              newRows as PathValue<TFormValues, Path<TFormValues>>,
                              {
                                shouldValidate: true,
                                shouldDirty: true,
                              }
                            )
                          }}
                        >
                          <SelectTrigger_Shadcn_ className="w-[150px] h-7">
                            <SelectValue_Shadcn_ placeholder="Set access" />
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            {sortActions(selectedResource.actions).map((action) => (
                              <SelectItem_Shadcn_ key={action} value={action}>
                                {formatAccessText(action)}
                              </SelectItem_Shadcn_>
                            ))}
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                      )}
                      <Button
                        type="text"
                        size="tiny"
                        className="p-1"
                        onClick={() => {
                          const newRows = permissionRows.filter((_, i) => i !== index)
                          setValue(
                            'permissionRows' as Path<TFormValues>,
                            newRows as PathValue<TFormValues, Path<TFormValues>>
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
