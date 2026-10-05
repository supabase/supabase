import { ChevronRight } from 'lucide-react'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import {
  Button,
  FormControl,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { CreateProjectForm } from './ProjectCreation.schema'
import {
  GeneralRegionSelectItems,
  RegionSelectTriggerValue,
  SpecificRegionSelectItems,
  useRegionSelectorOptions,
  type RegionSelectProps,
} from './RegionSelector.shared'
import { SELECT_DIFFERENT_REGION } from './RegionSelector.utils'
import Panel from '@/components/ui/Panel'
import { RegionFlag } from '@/components/ui/RegionFlag'
import type { DesiredInstanceSize } from '@/data/projects/new-project.constants'
import { usePHFlag } from '@/hooks/ui/useFlag'

/**
 * Advanced region config experiment (P-PROD-4259). Everything experiment-specific lives in this
 * file: variant resolution, the instrumentation stubs, and the three treatments. Deleting this
 * file plus its two call sites in RegionSelector/ProjectCreationForm removes the experiment.
 */

export const ADVANCED_REGION_CONFIG_VARIANTS = [
  'control',
  'option_a',
  'option_b',
  'option_c',
] as const

export type AdvancedRegionConfigVariant = (typeof ADVANCED_REGION_CONFIG_VARIANTS)[number]

export const ADVANCED_REGION_CONFIG_FLAG_KEY = 'advancedRegionConfig'
export const ADVANCED_REGION_CONFIG_EXPERIMENT_ID = 'advanced_region_config'
export const ADVANCED_REGION_CONFIG_QUERY_PARAM = 'regionVariant'

export function parseAdvancedRegionConfigVariant(
  value: unknown
): AdvancedRegionConfigVariant | undefined {
  return ADVANCED_REGION_CONFIG_VARIANTS.find((variant) => variant === value)
}

/**
 * Resolution order, first match wins:
 * 1. `?regionVariant=` — ignored in production so the override can't leak into the experiment
 * 2. the remote PostHog flag value
 * 3. `control`
 */
export function resolveAdvancedRegionConfigVariant({
  queryParamValue,
  flagValue,
  isProduction,
}: {
  queryParamValue: string | null | undefined
  flagValue: string | boolean | undefined
  isProduction: boolean
}): AdvancedRegionConfigVariant {
  if (!isProduction) {
    const override = parseAdvancedRegionConfigVariant(queryParamValue)
    if (override !== undefined) return override
  }

  return parseAdvancedRegionConfigVariant(flagValue) ?? 'control'
}

/** Variant assignment. Unknown flag values and unknown query params both fall back to `control`. */
export function useAdvancedRegionConfigVariant(): AdvancedRegionConfigVariant {
  const [queryParamValue] = useQueryState(ADVANCED_REGION_CONFIG_QUERY_PARAM, parseAsString)
  const flagValue = usePHFlag<string>(ADVANCED_REGION_CONFIG_FLAG_KEY)

  return resolveAdvancedRegionConfigVariant({
    queryParamValue,
    flagValue,
    isProduction: process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod',
  })
}

/**
 * TODO(P-PROD-4259): prototype-only no-op instrumentation.
 *
 * Each handler below is where the real PostHog event belongs once a variant wins. Wire them up
 * the way the existing project-creation experiments do:
 * - exposure -> `useTrackExperimentExposure(ADVANCED_REGION_CONFIG_EXPERIMENT_ID, variant)` from
 *   `hooks/misc/useTrackExperimentExposure.ts`, which is what the plan-presentation experiment
 *   uses and what the Best-available region work would plug into
 * - the two interaction events -> `useTrack()` from `lib/telemetry/track`, after adding the event
 *   names to `packages/common/telemetry-constants.ts`
 * - carry the resolved variant as a property on every event, and add it to the existing
 *   `project_creation_simple_version_submitted` payload in ProjectCreationForm the same way
 *   `dataApiRevokeOnCreateDefaultEnabled` is attached there
 */
export function useAdvancedRegionConfigTelemetry(variant: AdvancedRegionConfigVariant) {
  useEffect(() => {
    // TODO(P-PROD-4259): variant exposure
    void variant
  }, [variant])

  const trackDisclosureOpened = () => {
    // TODO(P-PROD-4259): disclosure opened
    void variant
  }

  const trackSpecificRegionSelected = (_regionCode: string | undefined) => {
    // TODO(P-PROD-4259): specific region selected
    void variant
  }

  return { trackDisclosureOpened, trackSpecificRegionSelected }
}

const TRIGGER_CLASS =
  '[&>:nth-child(1)]:w-full [&>:nth-child(1)]:flex [&>:nth-child(1)]:items-start'

/**
 * Option A — the specific regions stay in the same dropdown, but behind an inline disclosure at
 * the bottom of the list.
 */
export const RegionSelectorOptionA = ({
  options,
  value,
  onChange,
  triggerRef,
  onDisclosureOpened,
  onSpecificRegionSelected,
}: RegionSelectProps) => {
  const {
    generalRegions,
    specificRegions,
    recommendedGeneralRegionCodes,
    recommendedSpecificRegionCodes,
    selectedRegion,
    selectedRegionLabel,
    specificRegionsLabel,
    hasGeneralRegions,
    isLoading,
  } = options

  const [hasOpenedDisclosure, setHasOpenedDisclosure] = useState(false)
  const isSpecificRegionSelected = specificRegions.some((region) => region.name === value)
  const areSpecificRegionsVisible =
    hasOpenedDisclosure || isSpecificRegionSelected || !hasGeneralRegions

  const handleOpenDisclosure = () => {
    setHasOpenedDisclosure(true)
    onDisclosureOpened()
  }

  const handleValueChange = (nextValue: string) => {
    const specificRegion = specificRegions.find((region) => region.name === nextValue)
    if (specificRegion !== undefined) onSpecificRegionSelected(specificRegion.code)
    onChange(nextValue)
  }

  return (
    <FormControl>
      <Select value={value} onValueChange={handleValueChange} disabled={isLoading}>
        <SelectTrigger ref={triggerRef} id="region" className={TRIGGER_CLASS}>
          <SelectValue
            placeholder={
              isLoading ? 'Loading available regions...' : 'Select a region for your project..'
            }
          >
            {value !== undefined && (
              <RegionSelectTriggerValue
                region={selectedRegion}
                label={isLoading ? 'Loading available regions...' : selectedRegionLabel}
                isLoading={isLoading}
              />
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {hasGeneralRegions && (
            <>
              <SelectGroup>
                <SelectLabel>General regions</SelectLabel>
                <GeneralRegionSelectItems
                  regions={generalRegions}
                  recommendedCodes={recommendedGeneralRegionCodes}
                />
              </SelectGroup>
              <SelectSeparator />
            </>
          )}

          {!areSpecificRegionsVisible && (
            <button
              type="button"
              onClick={handleOpenDisclosure}
              className="w-full flex items-center gap-x-1 px-2 py-1.5 text-sm text-foreground-light hover:text-foreground rounded-sm hover:bg-overlay-hover transition"
            >
              <ChevronRight size={14} strokeWidth={1.5} />
              Advanced: choose a specific region
            </button>
          )}

          {areSpecificRegionsVisible && (
            <SelectGroup>
              <SelectLabel>{specificRegionsLabel}</SelectLabel>
              <SpecificRegionSelectItems
                regions={specificRegions}
                recommendedCodes={recommendedSpecificRegionCodes}
              />
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </FormControl>
  )
}

/**
 * Option B — the main form only reports the current region as text; the picker itself is rendered
 * inside the "Advanced Configuration" section by ProjectCreationForm.
 */
export const RegionSummaryRow = ({
  form,
  hasSelectedOrganization,
  instanceSize,
  onChangeRegionClick,
}: {
  form: UseFormReturn<CreateProjectForm>
  hasSelectedOrganization: boolean
  instanceSize?: DesiredInstanceSize
  onChangeRegionClick: () => void
}) => {
  const { selectedRegion, selectedRegionLabel, selectedRestrictionCopy, isLoading } =
    useRegionSelectorOptions({ form, hasSelectedOrganization, instanceSize })

  return (
    <Panel.Content>
      <FormItemLayout layout="horizontal" label="Region" isReactForm={false}>
        <div className="flex items-center gap-x-3 min-h-[38px]">
          {!isLoading && selectedRegion?.code && (
            <RegionFlag className="w-5" region={selectedRegion.code} />
          )}
          <span className="text-sm text-foreground">
            {isLoading ? 'Loading available regions...' : (selectedRegionLabel ?? 'Not selected')}
          </span>
          <Button type="button" variant="link" size="tiny" onClick={onChangeRegionClick}>
            Change in advanced configuration
          </Button>
        </div>
      </FormItemLayout>

      {selectedRestrictionCopy !== undefined && (
        <FormItemLayout layout="horizontal" isReactForm={false}>
          <Admonition
            type="warning"
            title={selectedRestrictionCopy.title}
            description={`${selectedRestrictionCopy.notice} ${SELECT_DIFFERENT_REGION}`}
            className="mt-3"
          />
        </FormItemLayout>
      )}
    </Panel.Content>
  )
}

/**
 * Sentinel for the "Choose a specific region" entry in the first dropdown. It is never written to
 * `dbRegion` — picking it only reveals the second selector.
 */
const CHOOSE_SPECIFIC_REGION = '__choose_specific_region__'

/**
 * Option C — two-step selector. The first dropdown offers the general regions plus an entry that
 * reveals a second dropdown holding the specific regions.
 */
export const RegionSelectorOptionC = ({
  options,
  value,
  onChange,
  triggerRef,
  onDisclosureOpened,
  onSpecificRegionSelected,
}: RegionSelectProps) => {
  const {
    generalRegions,
    specificRegions,
    recommendedGeneralRegionCodes,
    recommendedSpecificRegionCodes,
    selectedRegion,
    selectedRegionLabel,
    specificRegionsLabel,
    hasGeneralRegions,
    isLoading,
  } = options

  const [isChoosingSpecificRegion, setIsChoosingSpecificRegion] = useState(false)
  const isSpecificRegionSelected = specificRegions.some((region) => region.name === value)
  const isSpecificSelectVisible =
    isChoosingSpecificRegion || isSpecificRegionSelected || !hasGeneralRegions

  const handleGeneralValueChange = (nextValue: string) => {
    if (nextValue === CHOOSE_SPECIFIC_REGION) {
      setIsChoosingSpecificRegion(true)
      onDisclosureOpened()
      return
    }

    // Picking a general region clears the specific choice by overwriting `dbRegion` outright.
    setIsChoosingSpecificRegion(false)
    onChange(nextValue)
  }

  const handleSpecificValueChange = (nextValue: string) => {
    const specificRegion = specificRegions.find((region) => region.name === nextValue)
    if (specificRegion !== undefined) onSpecificRegionSelected(specificRegion.code)
    onChange(nextValue)
  }

  return (
    <div className="flex flex-col gap-y-2">
      <FormControl>
        <Select
          value={isSpecificSelectVisible ? CHOOSE_SPECIFIC_REGION : value}
          onValueChange={handleGeneralValueChange}
          disabled={isLoading}
        >
          <SelectTrigger ref={triggerRef} id="region" className={TRIGGER_CLASS}>
            <SelectValue
              placeholder={
                isLoading ? 'Loading available regions...' : 'Select a region for your project..'
              }
            >
              {isSpecificSelectVisible && (
                <span className="text-foreground">Choose a specific region</span>
              )}
              {!isSpecificSelectVisible && value !== undefined && (
                <RegionSelectTriggerValue
                  region={selectedRegion}
                  label={isLoading ? 'Loading available regions...' : selectedRegionLabel}
                  isLoading={isLoading}
                />
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {hasGeneralRegions && (
              <>
                <SelectGroup>
                  <SelectLabel>General regions</SelectLabel>
                  <GeneralRegionSelectItems
                    regions={generalRegions}
                    recommendedCodes={recommendedGeneralRegionCodes}
                  />
                </SelectGroup>
                <SelectSeparator />
              </>
            )}

            <SelectItem value={CHOOSE_SPECIFIC_REGION}>Choose a specific region</SelectItem>
          </SelectContent>
        </Select>
      </FormControl>

      {isSpecificSelectVisible && (
        <Select
          value={isSpecificRegionSelected ? value : ''}
          onValueChange={handleSpecificValueChange}
          disabled={isLoading}
        >
          <SelectTrigger id="specific-region" className={TRIGGER_CLASS}>
            <SelectValue placeholder="Select a specific region...">
              {isSpecificRegionSelected && (
                <RegionSelectTriggerValue
                  region={selectedRegion}
                  label={selectedRegionLabel}
                  isLoading={isLoading}
                />
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{specificRegionsLabel}</SelectLabel>
              <SpecificRegionSelectItems
                regions={specificRegions}
                recommendedCodes={recommendedSpecificRegionCodes}
              />
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
