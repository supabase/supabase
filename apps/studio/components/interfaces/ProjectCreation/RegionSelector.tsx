import { useFeatureFlags, useParams } from 'common'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { UseFormReturn } from 'react-hook-form'
import type { CloudProvider } from 'shared-data'
import {
  Badge,
  cn,
  FormControl,
  FormField,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useWatch,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CreateProjectForm } from './ProjectCreation.schema'
import {
  filterHighAvailabilityRegions,
  getAvailableRegions,
  getHighAvailabilityRegionCode,
} from './ProjectCreation.utils'
import { AlertError } from '@/components/ui/AlertError'
import { InlineLink } from '@/components/ui/InlineLink'
import Panel from '@/components/ui/Panel'
import { useDefaultRegionQuery } from '@/data/misc/get-default-region-query'
import { useOrganizationAvailableRegionsQuery } from '@/data/organizations/organization-available-regions-query'
import { useIncidentStatusQuery } from '@/data/platform/incident-status-query'
import type { DesiredInstanceSize } from '@/data/projects/new-project.constants'
import { BASE_PATH } from '@/lib/constants'

interface RegionSelectorProps {
  form: UseFormReturn<CreateProjectForm>
  instanceSize?: DesiredInstanceSize
  layout?: 'vertical' | 'horizontal'
}

// [Joshen] Let's use a library to maintain the flag SVGs in the future
// I tried using https://flagpack.xyz/docs/development/react/ but couldn't get it to render
// ^ can try again next time

// Maps smart region group codes to the specific-region code prefixes they contain.
// Used to check whether an incident affecting specific regions also affects a smart region selection.
const SMART_REGION_PREFIXES: Record<string, Array<string>> = {
  americas: ['us-', 'ca-', 'sa-'],
  emea: ['eu-', 'me-', 'af-'],
  apac: ['ap-'],
}

function smartRegionMatchesSpecific(smartCode: string, specificCode: string): boolean {
  return (SMART_REGION_PREFIXES[smartCode] ?? []).some((prefix) => specificCode.startsWith(prefix))
}

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
  const highAvailability = useWatch({ control: form.control, name: 'highAvailability' })
  const dbRegion = useWatch({ control: form.control, name: 'dbRegion' })
  const highAvailabilityRegionCode = getHighAvailabilityRegionCode()

  const { hasLoaded: flagsLoaded } = useFeatureFlags()
  const smartRegionEnabled = cloudProvider !== 'AWS_NIMBUS'

  const { data: statusData } = useIncidentStatusQuery()
  const { incidents = [] } = statusData ?? {}

  const { isPending: isLoadingDefaultRegion } = useDefaultRegionQuery(
    { cloudProvider },
    { enabled: flagsLoaded && !smartRegionEnabled }
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

  const allSmartRegions = availableRegionsData?.all.smartGroup ?? []
  const allRegions = availableRegionsData?.all.specific ?? []
  const restrictHighAvailabilityRegion =
    highAvailability && highAvailabilityRegionCode !== undefined
  const smartRegions = highAvailability ? [] : allSmartRegions

  const recommendedSmartRegions = new Set(
    [availableRegionsData?.recommendations.smartGroup.code].filter(Boolean)
  )
  const recommendedSpecificRegions = new Set(
    availableRegionsData?.recommendations.specific.map((region) => region.code)
  )

  const availableRegions = getAvailableRegions(cloudProvider)
  const regionsArray = Object.entries(availableRegions).map(([_key, value]) => {
    return {
      code: value.code,
      name: value.displayName,
      provider: cloudProvider,
      status: undefined,
    }
  })

  const unfilteredRegionOptions = smartRegionEnabled ? allRegions : regionsArray
  const regionOptions = filterHighAvailabilityRegions(
    [...unfilteredRegionOptions],
    highAvailability
  )
  const isLoading = smartRegionEnabled ? isLoadingAvailableRegions : isLoadingDefaultRegion

  const showNonProdFields =
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'local' ||
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'

  const allSelectableRegions = [...smartRegions, ...regionOptions]

  // react-hook-form intermittently drops this field's value when its Controller
  // remounts (e.g. a sibling section mounting/unmounting in the same update, such as
  // toggling high availability), so a one-shot effect isn't enough. Instead this effect
  // re-asserts off the watched value: a region present in the current list is kept (and
  // remembered in lastValidRegionRef), and when it's missing or cleared out from under us
  // it restores the last valid region. allSelectableRegions is intentionally omitted from
  // deps — it's a new array every render, and comparing it by reference would defeat the
  // point of reacting to genuine content changes on every render where they occur.
  const lastValidRegionRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (allSelectableRegions.length === 0) return
    const isRegionAvailable = (name: string | undefined) =>
      !!name && allSelectableRegions.some((region) => region.name === name)

    if (isRegionAvailable(dbRegion)) {
      lastValidRegionRef.current = dbRegion
      return
    }

    const lastValidRegion = lastValidRegionRef.current
    if (lastValidRegion !== undefined && isRegionAvailable(lastValidRegion)) {
      form.setValue('dbRegion', lastValidRegion)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbRegion, form])

  if (isErrorAvailableRegions) {
    return <AlertError subject="Error loading available regions" error={errorAvailableRegions} />
  }

  return (
    <Panel.Content>
      <FormField
        control={form.control}
        name="dbRegion"
        render={({ field }) => {
          const selectedRegion = allSelectableRegions.find((region) => {
            return !!region.name && region.name === dbRegion
          })

          const selectedRegionLabel = selectedRegion?.name
            ? getDisplayNameForSmartRegion(selectedRegion.name)
            : dbRegion
          const triggerLabel = isLoadingAvailableRegions
            ? 'Loading available regions...'
            : selectedRegionLabel

          const affectingIncidents = incidents.filter((incident) => {
            const affectedRegions = incident.cache?.affected_regions ?? []
            if (affectedRegions.length === 0 || selectedRegion?.code === undefined) return false

            // Specific region: direct code match
            if (affectedRegions.includes(selectedRegion.code)) return true

            // Smart region: match if any affected region falls within the smart group
            return affectedRegions.some((specificCode) =>
              smartRegionMatchesSpecific(selectedRegion.code, specificCode)
            )
          })

          return (
            <>
              <FormItemLayout
                id="region"
                layout={layout}
                label="Region"
                description={
                  <>
                    <p>Select the region closest to your users for the best performance.</p>
                    {restrictHighAvailabilityRegion ? (
                      <div className="mt-2 text-warning">
                        High Availability projects are currently limited to{' '}
                        {regionOptions[0]?.name ?? highAvailabilityRegionCode}.
                      </div>
                    ) : (
                      showNonProdFields && (
                        <div className="mt-2 text-warning">
                          <p>Only these regions are supported for local/staging projects:</p>
                          <ul className="list-disc list-inside mt-1">
                            <li>East US (North Virginia)</li>
                            <li>Central EU (Frankfurt)</li>
                            <li>Southeast Asia (Singapore)</li>
                          </ul>
                        </div>
                      )
                    )}
                  </>
                }
              >
                <FormControl>
                  <Select value={dbRegion} onValueChange={field.onChange} disabled={isLoading}>
                    <SelectTrigger
                      id="region"
                      className="[&>:nth-child(1)]:w-full [&>:nth-child(1)]:flex [&>:nth-child(1)]:items-start"
                    >
                      <SelectValue
                        placeholder={
                          isLoading
                            ? 'Loading available regions...'
                            : 'Select a region for your project..'
                        }
                      >
                        {dbRegion !== undefined && (
                          <div className="flex items-center gap-x-3">
                            {isLoadingAvailableRegions && (
                              <Loader2 size={14} className="animate-spin" />
                            )}
                            {selectedRegion?.code && (
                              // For some reason, Safari considered the empty string alt text on this icon as misspelled (with VoiceOver)
                              // Only way to fix it is to set the role. Not needed for the combobox options
                              // eslint-disable-next-line jsx-a11y/alt-text
                              <img
                                role="presentation"
                                className="w-5 rounded-xs"
                                src={`${BASE_PATH}/img/regions/${selectedRegion.code}.svg`}
                              />
                            )}
                            <span className="text-foreground">{triggerLabel}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {smartRegionEnabled && !highAvailability && (
                        <>
                          <SelectGroup>
                            <SelectLabel>General regions</SelectLabel>
                            {smartRegions.map((value) => {
                              return (
                                <SelectItem
                                  key={value.code}
                                  value={value.name}
                                  className="w-full [&>:nth-child(2)]:w-full"
                                >
                                  <div className="flex flex-row items-center justify-between w-full">
                                    <div className="flex items-center gap-x-3">
                                      <img
                                        alt=""
                                        className="w-5 rounded-xs"
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
                                </SelectItem>
                              )
                            })}
                          </SelectGroup>
                          <SelectSeparator />
                        </>
                      )}

                      <SelectGroup>
                        <SelectLabel>
                          {highAvailability ? 'High Availability Regions' : 'Specific regions'}
                        </SelectLabel>
                        {regionOptions.map((value) => {
                          return (
                            <SelectItem
                              key={value.code}
                              value={value.name}
                              className={cn(
                                'w-full [&>:nth-child(2)]:w-full',
                                value.status !== undefined && 'pointer-events-auto!'
                              )}
                              disabled={value.status !== undefined}
                            >
                              <div className="flex flex-row items-center justify-between w-full gap-x-2">
                                <div className="flex items-center gap-x-3">
                                  <img
                                    alt=""
                                    className="w-5 rounded-xs"
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
                            </SelectItem>
                          )
                        })}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItemLayout>

              {affectingIncidents.length > 0 && (
                <FormItemLayout layout="horizontal">
                  <Admonition
                    type="warning"
                    title="Incident in progress for this region"
                    description={
                      <>
                        We're currently investigating an issue that may impact projects in this
                        region. Follow updates on{' '}
                        <InlineLink href="https://status.supabase.com">
                          status.supabase.com
                        </InlineLink>
                        .
                      </>
                    }
                    className="mt-3"
                  />
                </FormItemLayout>
              )}
            </>
          )
        }}
      />
    </Panel.Content>
  )
}
