import { useDefaultRegionQuery } from 'data/misc/get-default-region-query'
import { CloudProvider, PROVIDERS } from 'lib/constants'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { ControllerRenderProps, UseFormReturn } from 'react-hook-form'
import {
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { getAvailableRegions } from './ProjectCreation.utils'

interface RegionSelectorProps {
  cloudProvider: CloudProvider
  field: ControllerRenderProps<any, 'dbRegion'>
  form: UseFormReturn<any>
}

export const RegionSelector = ({ cloudProvider, field, form }: RegionSelectorProps) => {
  const router = useRouter()
  const availableRegions = getAvailableRegions(PROVIDERS[cloudProvider].id)

  const {
    data: region,
    isSuccess,
    isError,
  } = useDefaultRegionQuery(
    { cloudProvider },
    { refetchOnMount: false, refetchOnWindowFocus: false, refetchInterval: false }
  )

  useEffect(() => {
    // only pick a region if one hasn't already been selected
    if (isError && !field.value) {
      // if an error happened, and the user haven't selected a region, just select the default one for him
      form.setValue('dbRegion', PROVIDERS[cloudProvider].default_region)
    }
  }, [cloudProvider, isError, isSuccess, field.value, form])

  return (
    <FormItemLayout
      layout="horizontal"
      label="Region"
      description="Select the region closest to your users for the best performance."
    >
      <Select_Shadcn_
        value={field.value}
        onValueChange={(value) => {
          if (isSuccess && region && !field.value) {
            field.onChange(value)
          }
        }}
      >
        <SelectTrigger_Shadcn_>
          <SelectValue_Shadcn_ placeholder="Select a region for your project.." />
        </SelectTrigger_Shadcn_>
        <SelectContent_Shadcn_>
          <SelectGroup_Shadcn_>
            {Object.keys(availableRegions).map((option: string, i) => {
              const label = Object.values(availableRegions)[i] as string
              return (
                <SelectItem_Shadcn_ key={option} value={label}>
                  <div className="flex items-center gap-3">
                    <img
                      alt="region icon"
                      className="w-5 rounded-sm"
                      src={`${router.basePath}/img/regions/${Object.keys(availableRegions)[i]}.svg`}
                    />
                    <span className="text-foreground">{label}</span>
                  </div>
                </SelectItem_Shadcn_>
              )
            })}
          </SelectGroup_Shadcn_>
        </SelectContent_Shadcn_>
      </Select_Shadcn_>
    </FormItemLayout>
  )
}
