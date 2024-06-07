import { useDefaultRegionQuery } from 'data/misc/get-default-region-query'
import { CloudProvider, PROVIDERS } from 'lib/constants'
import { useRouter } from 'next/router'
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
  const showNonProdFields =
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'local' ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'

  const availableRegions = getAvailableRegions(PROVIDERS[cloudProvider].id)

  const { isLoading: isLoadingDefaultRegion } = useDefaultRegionQuery({
    cloudProvider,
  })

  return (
    <FormItemLayout
      layout="horizontal"
      label="Region"
      description={
        <>
          <p>Select the region closest to your users for the best performance.</p>
          {showNonProdFields && (
            <p className="text-warning">Note: Only SG is supported for local/staging projects</p>
          )}
        </>
      }
    >
      <Select_Shadcn_
        value={field.value}
        onValueChange={field.onChange}
        disabled={isLoadingDefaultRegion}
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
