import { useRouter } from 'next/router'
import { ControllerRenderProps, UseFormReturn } from 'react-hook-form'

import { useDefaultRegionQuery } from 'data/misc/get-default-region-query'
import { PROVIDERS } from 'lib/constants'
import type { CloudProvider } from 'shared-data'
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

// [Joshen] Let's use a library to maintain the flag SVGs in the future
// I tried using https://flagpack.xyz/docs/development/react/ but couldn't get it to render
// ^ can try again next time

export const RegionSelector = ({ cloudProvider, field }: RegionSelectorProps) => {
  const router = useRouter()

  const showNonProdFields =
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'local' ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'

  const availableRegions = getAvailableRegions(PROVIDERS[cloudProvider].id)
  const regionsArray = Object.entries(availableRegions)

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
            {regionsArray.map(([key, value]) => {
              const label = value.displayName as string
              return (
                <SelectItem_Shadcn_ key={key} value={label}>
                  <div className="flex items-center gap-3">
                    <img
                      alt="region icon"
                      className="w-5 rounded-sm"
                      src={`${router.basePath}/img/regions/${key}.svg`}
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
