import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'
import { Button, Form, IconClock, Input, Listbox } from 'ui'

import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useProjectStorageConfigUpdateUpdateMutation } from 'data/config/project-storage-config-update-mutation'
import { useCheckPermissions, useStore } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { StorageSizeUnits, STORAGE_FILE_SIZE_LIMIT_MAX_BYTES } from './StorageSettings.constants'
import { convertFromBytes, convertToBytes } from './StorageSettings.utils'

export type StorageSettingsProps = {
  projectRef: string | undefined
  organizationSlug: string | undefined
}

const StorageSettings = ({ projectRef, organizationSlug }: StorageSettingsProps) => {
  const { data, error } = useProjectStorageConfigQuery({ projectRef }, { enabled: IS_PLATFORM })

  if (error || data?.error) {
    return (
      <div className="p-6 mx-auto text-center sm:w-full md:w-3/4">
        <p className="text-sm">Error loading storage settings</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="w-full">
        <GenericSkeletonLoader />
      </div>
    )
  }

  return <StorageConfig config={data} projectRef={projectRef} organizationSlug={organizationSlug} />
}

const StorageConfig = ({ config, projectRef, organizationSlug }: any) => {
  const { fileSizeLimit, isFreeTier } = config
  const { value, unit } = convertFromBytes(fileSizeLimit)

  const { ui } = useStore()
  const [selectedUnit, setSelectedUnit] = useState(unit)
  let initialValues = { fileSizeLimit: value, unformattedFileSizeLimit: fileSizeLimit }

  const canUpdateStorageSettings = useCheckPermissions(PermissionAction.STORAGE_ADMIN_WRITE, '*')
  const { mutate: updateStorageConfig, isLoading: isUpdating } =
    useProjectStorageConfigUpdateUpdateMutation({
      onSuccess: (res) => {
        const updatedValue = convertFromBytes(res.fileSizeLimit)
        initialValues = {
          fileSizeLimit: updatedValue.value,
          unformattedFileSizeLimit: res.fileSizeLimit,
        }
        ui.setNotification({
          category: 'success',
          message: 'Successfully updated storage settings',
        })
      },
    })

  const formattedMaxSizeBytes = `${new Intl.NumberFormat('en-US').format(
    STORAGE_FILE_SIZE_LIMIT_MAX_BYTES
  )} bytes`

  const { value: formattedMaxLimit } = convertFromBytes(
    STORAGE_FILE_SIZE_LIMIT_MAX_BYTES,
    selectedUnit
  )

  const onValidate = (values: any) => {
    const errors = {} as any
    if (values.fileSizeLimit > formattedMaxLimit) {
      errors[
        'fileSizeLimit'
      ] = `Maximum limit is up to ${formattedMaxLimit.toLocaleString()} ${selectedUnit}.`
    }
    return errors
  }

  const onSubmit = async (values: any) => {
    const errors = onValidate(values)

    if (errors.fileSizeLimit) {
      return ui.setNotification({
        category: 'error',
        message: `Upload file size limit must be up to 5GB (${formattedMaxSizeBytes})`,
      })
    }

    updateStorageConfig({
      projectRef,
      fileSizeLimit: convertToBytes(values.fileSizeLimit, selectedUnit),
    })
  }

  // [Joshen] To be refactored using FormContainer, FormPanel, FormContent etc once
  // Jonny's auth config refactor PR goes in
  return (
    <div>
      <Form validateOnBlur initialValues={initialValues} validate={onValidate} onSubmit={onSubmit}>
        {({ values, handleReset }: { values: any; handleReset: () => void }) => {
          const hasChanges =
            initialValues.unformattedFileSizeLimit !==
            convertToBytes(values.fileSizeLimit, selectedUnit)
          return (
            <>
              <div className="mb-6">
                <h3 className="mb-2 text-xl text-foreground">Storage Settings</h3>
                <div className="text-sm text-foreground-lighter">
                  Configure your project's storage settings
                </div>
              </div>
              <div className="space-y-20">
                <div
                  className={[
                    'bg-surface-100',
                    'overflow-hidden border-muted',
                    'rounded-md border shadow',
                  ].join(' ')}
                >
                  <div className="flex flex-col gap-0 divide-y divide-border-muted">
                    <div className="grid grid-cols-12 gap-6 px-8 py-8 lg:gap-12">
                      <div className="relative flex flex-col col-span-12 gap-6 lg:col-span-4">
                        <p className="text-sm">Upload file size limit</p>
                      </div>
                      <div className="relative flex flex-col col-span-12 gap-x-6 gap-y-2 lg:col-span-8">
                        <div className="grid grid-cols-12 col-span-12 gap-2">
                          <div className="col-span-8">
                            <Input
                              id="fileSizeLimit"
                              name="fileSizeLimit"
                              type="number"
                              disabled={isFreeTier || !canUpdateStorageSettings}
                              step={1}
                              onKeyPress={(event) => {
                                if (event.charCode < 48 || event.charCode > 57) {
                                  event.preventDefault()
                                }
                              }}
                            />
                          </div>
                          <div className="col-span-4">
                            <Listbox
                              disabled={isFreeTier}
                              value={selectedUnit}
                              onChange={setSelectedUnit}
                            >
                              {Object.values(StorageSizeUnits).map((unit: string) => (
                                <Listbox.Option
                                  key={unit}
                                  disabled={isFreeTier}
                                  label={unit}
                                  value={unit}
                                >
                                  <div>{unit}</div>
                                </Listbox.Option>
                              ))}
                            </Listbox>
                          </div>
                        </div>
                        <p className="text-sm text-foreground-light">
                          {selectedUnit !== StorageSizeUnits.BYTES &&
                            `Equivalent to ${convertToBytes(
                              values.fileSizeLimit,
                              selectedUnit
                            ).toLocaleString()} bytes. `}
                          Maximum size in bytes of a file that can be uploaded is 5 GB (
                          {formattedMaxSizeBytes}).
                        </p>
                      </div>
                    </div>
                  </div>
                  {isFreeTier && (
                    <div className="px-6 pb-6">
                      <UpgradeToPro
                        icon={<IconClock size="large" />}
                        organizationSlug={organizationSlug}
                        primaryText="Free Plan has a fixed upload file size limit of 50 MB."
                        projectRef={projectRef}
                        secondaryText="Upgrade to the Pro plan for a configurable upload file size limit of up to 5 GB."
                      />
                    </div>
                  )}
                  <div className="border-t border-overlay" />
                  <div className="flex justify-between px-8 py-4">
                    <div className="flex items-center justify-between w-full gap-2">
                      {!canUpdateStorageSettings ? (
                        <p className="text-sm text-foreground-light">
                          You need additional permissions to update storage settings
                        </p>
                      ) : (
                        <div />
                      )}
                      <div className="flex gap-2">
                        <Button
                          type="default"
                          htmlType="reset"
                          onClick={() => handleReset()}
                          disabled={isUpdating || (!hasChanges && hasChanges !== undefined)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={isUpdating}
                          disabled={
                            !canUpdateStorageSettings ||
                            isUpdating ||
                            (!hasChanges && hasChanges !== undefined)
                          }
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )
        }}
      </Form>
    </div>
  )
}

export default StorageSettings
