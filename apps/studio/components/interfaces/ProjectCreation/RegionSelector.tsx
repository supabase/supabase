import { UseFormReturn } from 'react-hook-form'

import { useFlag, useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import Panel from 'components/ui/Panel'
import { useDefaultRegionQuery } from 'data/misc/get-default-region-query'
import { useOrganizationAvailableRegionsQuery } from 'data/organizations/organization-available-regions-query'
import type { DesiredInstanceSize } from 'data/projects/new-project.constants'
import { BASE_PATH, PROVIDERS } from 'lib/constants'
import type { CloudProvider } from 'shared-data'
import {
  Badge,
  FormField_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectLabel_Shadcn_,
  SelectSeparator_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { CreateProjectForm } from './ProjectCreation.schema'
import { getAvailableRegions } from './ProjectCreation.utils'

interface RegionSelectorProps {
  form: UseFormReturn<CreateProjectForm>
  instanceSize?: DesiredInstanceSize
  layout?: 'vertical' | 'horizontal'
}

// [Joshen] Let's use a library to maintain the flag SVGs in the future
// I tried using https://flagpack.xyz/docs/development/react/ but couldn't get it to render
// ^ can try again next time

// Map backend region names to user-friendly display names
const getDisplayNameForSmartRegion = (name: string): string => {
  if (name === 'APAC') {
    return 'Asia-Pacific'
  }
  return name
}

export const RegionSelector = ({
  form,
  instanceSize,
  layout = 'horizontal',
}: RegionSelectorProps) => {
  const { slug } = useParams()
  const cloudProvider = form.getValues('cloudProvider') as CloudProvider

  const smartRegionEnabled = useFlag('enableSmartRegion')

  const { isPending: isLoadingDefaultRegion } = useDefaultRegionQuery(
    { cloudProvider },
    { enabled: !smartRegionEnabled }
  )

  const {
    data: availableRegionsData,
    isPending: isLoadingAvailableRegions,
    isError: isErrorAvailableRegions,
    error: errorAvailableRegions,
  } = useOrganizationAvailableRegionsQuery(
    { slug, cloudProvider, desiredInstanceSize: instanceSize },
    { enabled: smartRegionEnabled, staleTime: 1000 * 60 * 5 } // 5 minutes
  )

  const smartRegions = availableRegionsData?.all.smartGroup ?? []
  const allRegions = availableRegionsData?.all.specific ?? []

  const recommendedSmartRegions = new Set(
    [availableRegionsData?.recommendations.smartGroup.code].filter(Boolean)
  )
  const recommendedSpecificRegions = new Set(
    availableRegionsData?.recommendations.specific.map((region) => region.code)
  )

  const availableRegions = getAvailableRegions(PROVIDERS[cloudProvider].id)
  const regionsArray = Object.entries(availableRegions).map(([_key, value]) => {
    return {
      code: value.code,
      name: value.displayName,
      provider: cloudProvider,
      status: undefined,
    }
  })

  const regionOptions = smartRegionEnabled ? allRegions : regionsArray
  const isLoading = smartRegionEnabled ? isLoadingAvailableRegions : isLoadingDefaultRegion

  const showNonProdFields =
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'local' ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'

  const allSelectableRegions = [...smartRegions, ...regionOptions]

  if (isErrorAvailableRegions) {
    return <AlertError subject="Error loading available regions" error={errorAvailableRegions} />
  }

  return (
    <Panel.Content>
      <FormField_Shadcn_
        control={form.control}
        name="dbRegion"
        render={({ field }) => {
          const selectedRegion = allSelectableRegions.find((region) => {
            return !!region.name && region.name === field.value
          })

          return (
            <FormItemLayout
              layout={layout}
              label="Region"
              description={
                <>
                  <p>Select the region closest to your users for the best performance.</p>
                  {showNonProdFields && (
                    <div className="mt-2 text-warning">
                      <p>Only these regions are supported for local/staging projects:</p>
                      <ul className="list-disc list-inside mt-1">
                        <li>East US (North Virginia)</li>
                        <li>Central EU (Frankfurt)</li>
                        <li>Southeast Asia (Singapore)</li>
                      </ul>
                    </div>
                  )}
                </>
              }
            >
              <Select_Shadcn_
                value={field.value}
                onValueChange={field.onChange}
                disabled={isLoading}
              >
                <SelectTrigger_Shadcn_ className="[&>:nth-child(1)]:w-full [&>:nth-child(1)]:flex [&>:nth-child(1)]:items-start">
                  <SelectValue_Shadcn_
                    placeholder={
                      isLoading
                        ? 'Loading available regions...'
                        : 'Select a region for your project..'
                    }
                  >
                    {field.value !== undefined && (
                      <div className="flex items-center gap-x-3">
                        {selectedRegion?.code && (
                          <img
                            alt="region icon"
                            className="w-5 rounded-sm"
                            src={`${BASE_PATH}/img/regions/${selectedRegion.code}.svg`}
                          />
                        )}
                        <span className="text-foreground">
                          {selectedRegion?.name
                            ? getDisplayNameForSmartRegion(selectedRegion.name)
                            : field.value}
                        </span>
                      </div>
                    )}
                  </SelectValue_Shadcn_>
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  {smartRegionEnabled && (
                    <>
                      <SelectGroup_Shadcn_>
                        <SelectLabel_Shadcn_>General regions</SelectLabel_Shadcn_>
                        {smartRegions.map((value) => {
                          return (
                            <SelectItem_Shadcn_
                              key={value.code}
                              value={value.name}
                              className="w-full [&>:nth-child(2)]:w-full"
                            >
                              <div className="flex flex-row items-center justify-between w-full">
                                <div className="flex items-center gap-x-3">
                                  <img
                                    alt="region icon"
                                    className="w-5 rounded-sm"
                                    src={`${BASE_PATH}/img/regions/${value.code}.svg`}
                                  />
                                  <span className="text-foreground">
                                    {getDisplayNameForSmartRegion(value.name)}
                                  </span>
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
                    </>
                  )}

                  <SelectGroup_Shadcn_>
                    <SelectLabel_Shadcn_>Specific regions</SelectLabel_Shadcn_>
                    {regionOptions.map((value) => {
                      return (
                        <SelectItem_Shadcn_
                          key={value.code}
                          value={value.name}
                          className={cn(
                            'w-full [&>:nth-child(2)]:w-full',
                            value.status !== undefined && '!pointer-events-auto'
                          )}
                          disabled={value.status !== undefined}
                        >
                          <div className="flex flex-row items-center justify-between w-full gap-x-2">
                            <div className="flex items-center gap-x-3">
                              <img
                                alt="region icon"
                                className="w-5 rounded-sm"
                                src={`${BASE_PATH}/img/regions/${value.code}.svg`}
                              />
                              <div className="flex items-center gap-x-2">
                                <span className="text-foreground">{value.name}</span>
                                <span className="text-xs text-foreground-lighter font-mono">
                                  {value.code}
                                </span>
                              </div>
                            </div>

                            {recommendedSpecificRegions.has(value.code) && (
                              <Badge variant="success" className="mr-1">
                                Recommended
                              </Badge>
                            )}
                            {value.status !== undefined && value.status === 'capacity' && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="warning" className="mr-1">
                                    Unavailable
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Temporarily unavailable due to this region being at capacity.
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </SelectItem_Shadcn_>
                      )
                    })}
                  </SelectGroup_Shadcn_>
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </FormItemLayout>
          )
        }}
      />
    </Panel.Content>
  )
}
