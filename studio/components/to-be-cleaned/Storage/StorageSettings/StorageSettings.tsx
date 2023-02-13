import { useState } from 'react'
import { Button, Form, IconClock, Input, Listbox } from 'ui'

import { useStore } from 'hooks'
import { useProjectStorageConfigQuery } from 'data/config/project-storage-config-query'
import { useProjectStorageConfigUpdateUpdateMutation } from 'data/config/project-storage-config-update-mutation'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { convertFromBytes, convertToBytes } from './StorageSettings.utils'
import { StorageSizeUnits, STORAGE_FILE_SIZE_LIMIT_MAX_BYTES } from './StorageSettings.constants'

export type StorageSettingsProps = {
  projectRef: string | undefined
}

const StorageSettings = ({ projectRef }: StorageSettingsProps) => {
  const { data, error } = useProjectStorageConfigQuery({ projectRef })

  if (error || data?.error) {
    return (
      <div className="p-6 mx-auto text-center sm:w-full md:w-3/4">
        <p className="text-sm">Error loading storage settings</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 mx-auto text-center sm:w-full md:w-3/4">
        <p className="text-sm">Loading...</p>
      </div>
    )
  }

  return <StorageConfig config={data} projectRef={projectRef} />
}

const StorageConfig = ({ config, projectRef }: any) => {
  const { fileSizeLimit, isFreeTier } = config
  const { value, unit } = convertFromBytes(fileSizeLimit)

  const { ui } = useStore()
  const [selectedUnit, setSelectedUnit] = useState(unit)
  let initialValues = { fileSizeLimit: value, unformattedFileSizeLimit: fileSizeLimit }

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

  const { mutateAsync: updateStorageConfig } = useProjectStorageConfigUpdateUpdateMutation()

  const onSubmit = async (values: any) => {
    const errors = onValidate(values)

    if (errors.fileSizeLimit) {
      ui.setNotification({
        category: 'error',
        message: `Upload file size limit must be up to 5GB (${formattedMaxSizeBytes})`,
      })
    } else {
      try {
        const res = await updateStorageConfig({
          projectRef,
          fileSizeLimit: convertToBytes(values.fileSizeLimit, selectedUnit),
        })

        const updatedValue = convertFromBytes(res.fileSizeLimit)
        initialValues = {
          fileSizeLimit: updatedValue.value,
          unformattedFileSizeLimit: res.fileSizeLimit,
        }
        ui.setNotification({ category: 'success', message: 'Successfully updated settings' })
      } catch (error: any) {
        ui.setNotification({
          category: 'error',
          message: `Failed to update storage settings: ${error?.message}`,
        })
      }
    }
  }

  // [Joshen] To be refactored using FormContainer, FormPanel, FormContent etc once
  // Jonny's auth config refactor PR goes in
  return (
    <div className="mx-auto w-[56rem] max-w-4xl px-5 pt-12 pb-20">
      <Form validateOnBlur initialValues={initialValues} validate={onValidate} onSubmit={onSubmit}>
        {({
          values,
          isSubmitting,
          handleReset,
        }: {
          values: any
          isSubmitting: boolean
          handleReset: () => void
        }) => {
          const hasChanges =
            initialValues.unformattedFileSizeLimit !==
            convertToBytes(values.fileSizeLimit, selectedUnit)
          return (
            <>
              <div className="mb-6">
                <h3 className="mb-2 text-xl text-scale-1200">Storage settings</h3>
                <div className="text-sm text-scale-900">
                  Configure your project's storage settings
                </div>
              </div>
              <div className="space-y-20">
                <div
                  className={[
                    'bg-scale-100 dark:bg-scale-300',
                    'overflow-hidden border-scale-400',
                    'rounded-md border shadow',
                  ].join(' ')}
                >
                  <div className="flex flex-col gap-0 divide-y divide-scale-400">
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
                              disabled={isFreeTier}
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
                        <p className="text-sm text-scale-1100">
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
                        primaryText="Free Plan has a fixed upload file size limit of 50 MB."
                        projectRef={projectRef}
                        secondaryText="Please upgrade to Pro plan for a configurable upload file size limit of up to 5 GB."
                      />
                    </div>
                  )}
                  <div className="border-t border-scale-400" />
                  <div className="flex justify-between px-8 py-4">
                    <div className="flex items-center justify-end w-full gap-2">
                      <div className="flex gap-2">
                        <Button
                          type="default"
                          htmlType="reset"
                          onClick={() => handleReset()}
                          disabled={!hasChanges && hasChanges !== undefined}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={isSubmitting}
                          disabled={!hasChanges && hasChanges !== undefined}
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
