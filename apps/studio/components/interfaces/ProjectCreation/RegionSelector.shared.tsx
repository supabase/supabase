import { useFeatureFlags, useFlag, useParams } from 'common'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef, type Ref } from 'react'
import { UseFormReturn } from 'react-hook-form'
import type { CloudProvider } from 'shared-data'
import { Badge, cn, SelectItem, Tooltip, TooltipContent, TooltipTrigger, useWatch } from 'ui'

import { CreateProjectForm } from './ProjectCreation.schema'
import {
  filterHighAvailabilityRegions,
  getAvailableRegions,
  getHighAvailabilityRegionCode,
} from './ProjectCreation.utils'
import {
  getRegionRestrictionCopy,
  regionMatches,
  type RegionRestrictionCopy,
} from './RegionSelector.utils'
import { useRegionRestriction } from './useRegionRestriction'
import { RegionFlag } from '@/components/ui/RegionFlag'
import { useDefaultRegionQuery } from '@/data/misc/get-default-region-query'
import { useOrganizationAvailableRegionsQuery } from '@/data/organizations/organization-available-regions-query'
import { useIncidentStatusQuery } from '@/data/platform/incident-status-query'
import type { DesiredInstanceSize } from '@/data/projects/new-project.constants'
import type { ResponseError } from '@/types'

export type SelectableRegion = { code: string; name: string; status?: string }
export type RestrictableRegion = SelectableRegion & { restriction: string | undefined }

/** Props every arm of the region picker takes. */
export type RegionSelectProps = {
  options: RegionSelectorOptions
  value: string | undefined
  onChange: (value: string) => void
  triggerRef: Ref<HTMLButtonElement>
  onDisclosureOpened: () => void
  onSpecificRegionSelected: (regionCode: string | undefined) => void
}

/** Backend region names that read better in the UI under a different label. */
export const getDisplayNameForGeneralRegion = (name: string): string =>
  name === 'APAC' ? 'Asia-Pacific' : name

export type RegionSelectorOptions = {
  dbRegion: string | undefined
  generalRegions: SelectableRegion[]
  specificRegions: RestrictableRegion[]
  recommendedGeneralRegionCodes: Set<string | undefined>
  recommendedSpecificRegionCodes: Set<string>
  selectedRegion: SelectableRegion | undefined
  selectedRegionLabel: string | undefined
  selectedRestrictionCopy: RegionRestrictionCopy | undefined
  specificRegionsLabel: string
  hasGeneralRegions: boolean
  isLoading: boolean
  isError: boolean
  error: ResponseError | null
  affectingIncidents: unknown[]
  isStatusPageEnabled: boolean
  isHighAvailabilityRestricted: boolean
  highAvailabilityRegionLabel: string | undefined
}

/**
 * Region data, derived option lists and selection bookkeeping shared by every rendering of the
 * region picker, so no experiment variant has to duplicate any of it.
 */
export function useRegionSelectorOptions({
  form,
  hasSelectedOrganization,
  instanceSize,
}: {
  form: UseFormReturn<CreateProjectForm>
  hasSelectedOrganization: boolean
  instanceSize?: DesiredInstanceSize
}): RegionSelectorOptions {
  const { slug } = useParams()
  const cloudProvider = useWatch({ control: form.control, name: 'cloudProvider' }) as CloudProvider
  const highAvailability = useWatch({ control: form.control, name: 'highAvailability' })
  const dbRegion = useWatch({ control: form.control, name: 'dbRegion' })
  const highAvailabilityRegionCode = getHighAvailabilityRegionCode()

  const { hasLoaded: flagsLoaded } = useFeatureFlags()
  const smartRegionEnabled = cloudProvider !== 'AWS_NIMBUS'
  const isStatusPageEnabled = useFlag('incidentIoStatusPage') === true

  const { getRegionRestriction } = useRegionRestriction()

  const { data: statusData } = useIncidentStatusQuery({ enabled: !isStatusPageEnabled })
  const { incidents = [] } = statusData ?? {}

  const { isPending: isLoadingDefaultRegion } = useDefaultRegionQuery(
    { cloudProvider },
    { enabled: flagsLoaded && !smartRegionEnabled }
  )

  const {
    data: availableRegionsData,
    isPending: isLoadingAvailableRegions,
    isError,
    error,
  } = useOrganizationAvailableRegionsQuery(
    { slug, cloudProvider, desiredInstanceSize: instanceSize, highAvailability },
    { enabled: smartRegionEnabled && hasSelectedOrganization, staleTime: 1000 * 60 * 5 }
  )

  const isLocal = process.env.NEXT_PUBLIC_ENVIRONMENT === 'local'
  const allSmartRegions = availableRegionsData?.all.smartGroup ?? []
  const allRegions = availableRegionsData?.all.specific ?? []
  const isHighAvailabilityRestricted =
    highAvailability && !isLocal && highAvailabilityRegionCode !== undefined
  const generalRegions = highAvailability ? [] : allSmartRegions

  const recommendedGeneralRegionCodes = new Set(
    [availableRegionsData?.recommendations.smartGroup.code].filter(Boolean)
  )
  const recommendedSpecificRegionCodes = new Set(
    availableRegionsData?.recommendations.specific.map((region) => region.code)
  )

  const regionsArray = Object.entries(getAvailableRegions(cloudProvider)).map(([_key, value]) => ({
    code: value.code,
    name: value.displayName,
    provider: cloudProvider,
    status: undefined,
  }))

  const unfilteredRegionOptions = smartRegionEnabled ? allRegions : regionsArray
  const regionOptions = filterHighAvailabilityRegions(
    [...unfilteredRegionOptions],
    highAvailability
  )
  const specificRegions: RestrictableRegion[] = regionOptions.map((region) => ({
    ...region,
    restriction: getRegionRestriction(region),
  }))
  const isLoading = smartRegionEnabled ? isLoadingAvailableRegions : isLoadingDefaultRegion

  const allSelectableRegions = [...generalRegions, ...regionOptions]

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

  const selectedRegion = allSelectableRegions.find(
    (region) => !!region.name && region.name === dbRegion
  )
  const selectedRestriction = specificRegions.find(
    (region) => region.name === dbRegion
  )?.restriction

  return {
    dbRegion,
    generalRegions,
    specificRegions,
    recommendedGeneralRegionCodes,
    recommendedSpecificRegionCodes,
    selectedRegion,
    selectedRegionLabel: selectedRegion?.name
      ? getDisplayNameForGeneralRegion(selectedRegion.name)
      : dbRegion,
    selectedRestrictionCopy:
      selectedRestriction !== undefined ? getRegionRestrictionCopy(selectedRestriction) : undefined,
    specificRegionsLabel: highAvailability ? 'High Availability Regions' : 'Specific regions',
    hasGeneralRegions: smartRegionEnabled && !highAvailability,
    isLoading,
    isError,
    error,
    affectingIncidents: incidents.filter((incident) => {
      const affectedRegions = incident.cache?.affected_regions ?? []
      if (affectedRegions.length === 0 || selectedRegion?.code === undefined) return false
      return affectedRegions.some((affectedRegion) =>
        regionMatches(selectedRegion.code, affectedRegion)
      )
    }),
    isStatusPageEnabled,
    isHighAvailabilityRestricted,
    highAvailabilityRegionLabel: regionOptions[0]?.name ?? highAvailabilityRegionCode,
  }
}

export const RegionSelectTriggerValue = ({
  region,
  label,
  isLoading,
}: {
  region: SelectableRegion | undefined
  label: string | undefined
  isLoading: boolean
}) => (
  <div className="flex items-center gap-x-3">
    {isLoading && <Loader2 size={14} className="animate-spin" />}
    {region?.code && <RegionFlag className="w-5" region={region.code} />}
    <span className="text-foreground">{label}</span>
  </div>
)

export const GeneralRegionSelectItems = ({
  regions,
  recommendedCodes,
}: {
  regions: SelectableRegion[]
  recommendedCodes: Set<string | undefined>
}) =>
  regions.map((region) => (
    <SelectItem key={region.code} value={region.name} className="w-full [&>:nth-child(2)]:w-full">
      <div className="flex flex-row items-center justify-between w-full">
        <div className="flex items-center gap-x-3">
          <RegionFlag className="w-5" region={region.code} />
          <span className="text-foreground">{getDisplayNameForGeneralRegion(region.name)}</span>
        </div>

        <div>
          {recommendedCodes.has(region.code) && (
            <Badge variant="success" className="mr-1">
              Recommended
            </Badge>
          )}
        </div>
      </div>
    </SelectItem>
  ))

export const SpecificRegionSelectItems = ({
  regions,
  recommendedCodes,
}: {
  regions: RestrictableRegion[]
  recommendedCodes: Set<string>
}) =>
  regions.map((region) => {
    const restrictionCopy =
      region.restriction !== undefined ? getRegionRestrictionCopy(region.restriction) : undefined

    return (
      <SelectItem
        key={region.code}
        value={region.name}
        className={cn(
          'w-full [&>:nth-child(2)]:w-full',
          restrictionCopy !== undefined && 'pointer-events-auto!'
        )}
      >
        <div className="flex flex-row items-center justify-between w-full gap-x-2">
          <div className="flex items-center gap-x-3">
            <RegionFlag className="w-5" region={region.code} />
            <div className="flex items-center gap-x-2">
              <span className="text-foreground">{region.name}</span>
              <span className="text-xs text-foreground-lighter font-mono">{region.code}</span>
            </div>
          </div>

          {recommendedCodes.has(region.code) && (
            <Badge variant="success" className="mr-1">
              Recommended
            </Badge>
          )}

          {restrictionCopy !== undefined && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="warning" className="mr-1">
                  {restrictionCopy.badge}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>{restrictionCopy.tooltip}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </SelectItem>
    )
  })
