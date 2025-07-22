import { useRouter } from 'next/router'
import { ControllerRenderProps, UseFormReturn } from 'react-hook-form'

import { PROVIDERS } from 'lib/constants'
import type { CloudProvider } from 'shared-data'
import {
  Badge,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectLabel_Shadcn_,
  SelectSeparator_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { useOrganizationAvailableRegionsQuery } from 'data/organizations/organization-available-regions-query'

interface RegionSelectorProps {
  cloudProvider: CloudProvider
  field: ControllerRenderProps<any, 'dbRegion'>
  form: UseFormReturn<any>
  layout?: 'vertical' | 'horizontal'
  organizationSlug?: string
}

// [Joshen] Let's use a library to maintain the flag SVGs in the future
// I tried using https://flagpack.xyz/docs/development/react/ but couldn't get it to render
// ^ can try again next time

export const RegionSelector = ({
  cloudProvider,
  field,
  layout = 'horizontal',
  organizationSlug,
}: RegionSelectorProps) => {
  const router = useRouter()

  const { data: availableRegionsData, isLoading } = useOrganizationAvailableRegionsQuery({
    slug: organizationSlug,
    cloudProvider: cloudProvider as CloudProvider,
  })

  const smartRegions = availableRegionsData?.all.smartGroup ?? []
  const allRegions = availableRegionsData?.all.specific ?? []

  const recommendedSmartRegions = new Set(
    [availableRegionsData?.recommendations.smartGroup.code].filter(Boolean)
  )
  const recommendedSpecificRegions = new Set(
    availableRegionsData?.recommendations.specific.map((region) => region.code)
  )

  const showNonProdFields =
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'local' ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'

  return (
    <FormItemLayout
      layout={layout}
      label="Region"
      description={
        <>
          <p>Select the region closest to your users for the best performance.</p>
          {showNonProdFields && (
            <p className="text-warning">
              Note: Only US (NV), Frankfurt and SG are supported for local/staging projects
            </p>
          )}
        </>
      }
    >
      <Select_Shadcn_ value={field.value} onValueChange={field.onChange} disabled={isLoading}>
        <SelectTrigger_Shadcn_ className="[&>:nth-child(1)]:w-full [&>:nth-child(1)]:flex [&>:nth-child(1)]:items-start">
          <SelectValue_Shadcn_ placeholder="Select a region for your project.." />
        </SelectTrigger_Shadcn_>
        <SelectContent_Shadcn_>
          <SelectGroup_Shadcn_>
            <SelectLabel_Shadcn_>Smart Region Selection</SelectLabel_Shadcn_>
            {smartRegions.map((value) => {
              return (
                <SelectItem_Shadcn_
                  key={value.code}
                  value={value.name}
                  className="w-full [&>:nth-child(2)]:w-full"
                >
                  <div className="flex flex-row items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <img
                        alt="region icon"
                        className="w-5 rounded-sm"
                        src={`${router.basePath}/img/regions/${value.code}.svg`}
                      />
                      <span className="text-foreground">{value.name}</span>
                    </div>

                    <div>
                      {recommendedSmartRegions.has(value.code) && (
                        <Badge variant="success" className="mr-1">
                          Recommended
                        </Badge>
                      )}
                    </div>
                  </div>
                </SelectItem_Shadcn_>
              )
            })}
          </SelectGroup_Shadcn_>

          <SelectSeparator_Shadcn_ />

          <SelectGroup_Shadcn_>
            <SelectLabel_Shadcn_>All Regions</SelectLabel_Shadcn_>
            {allRegions.map((value) => {
              return (
                <SelectItem_Shadcn_
                  key={value.code}
                  value={value.name}
                  className="w-full [&>:nth-child(2)]:w-full"
                >
                  <div className="flex flex-row items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <img
                        alt="region icon"
                        className="w-5 rounded-sm"
                        src={`${router.basePath}/img/regions/${value.code}.svg`}
                      />
                      <span className="text-foreground">{value.name}</span>
                    </div>

                    <div>
                      {recommendedSpecificRegions.has(value.code) && (
                        <Badge variant="success" className="mr-1">
                          Recommended
                        </Badge>
                      )}
                    </div>
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
