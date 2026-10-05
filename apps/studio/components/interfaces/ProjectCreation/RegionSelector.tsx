import { UseFormReturn } from 'react-hook-form'
import {
  FormControl,
  FormField,
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import {
  RegionSelectorOptionA,
  RegionSelectorOptionC,
  useAdvancedRegionConfigTelemetry,
  type AdvancedRegionConfigVariant,
} from './AdvancedRegionConfig'
import { CreateProjectForm } from './ProjectCreation.schema'
import { ProjectCreationStatusAdmonition } from './ProjectCreationStatusAdmonition'
import {
  GeneralRegionSelectItems,
  RegionSelectTriggerValue,
  SpecificRegionSelectItems,
  useRegionSelectorOptions,
  type RegionSelectorOptions,
  type RegionSelectProps,
} from './RegionSelector.shared'
import { SELECT_DIFFERENT_REGION } from './RegionSelector.utils'
import { AlertError } from '@/components/ui/AlertError'
import { InlineLink } from '@/components/ui/InlineLink'
import Panel from '@/components/ui/Panel'
import type { DesiredInstanceSize } from '@/data/projects/new-project.constants'

interface RegionSelectorProps {
  form: UseFormReturn<CreateProjectForm>
  hasSelectedOrganization: boolean
  instanceSize?: DesiredInstanceSize
  layout?: 'vertical' | 'horizontal'
  /** Experiment arm (P-PROD-4259). `option_b` renders the control picker — it only moves place. */
  variant?: AdvancedRegionConfigVariant
  /** Set when rendered inside a section that already provides its own padding. */
  isEmbedded?: boolean
}

// [Joshen] Let's use a library to maintain the flag SVGs in the future
// I tried using https://flagpack.xyz/docs/development/react/ but couldn't get it to render
// ^ can try again next time

const isLocalEnvironment = process.env.NEXT_PUBLIC_ENVIRONMENT === 'local'
const showNonProdFields = isLocalEnvironment || process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'

/** The region picker as it ships today — the `control` arm of the experiment. */
const RegionSelectControl = ({ options, value, onChange, triggerRef }: RegionSelectProps) => {
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

  return (
    <FormControl>
      <Select value={value} onValueChange={onChange} disabled={isLoading}>
        <SelectTrigger
          ref={triggerRef}
          id="region"
          className="[&>:nth-child(1)]:w-full [&>:nth-child(1)]:flex [&>:nth-child(1)]:items-start"
        >
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

          <SelectGroup>
            <SelectLabel>{specificRegionsLabel}</SelectLabel>
            <SpecificRegionSelectItems
              regions={specificRegions}
              recommendedCodes={recommendedSpecificRegionCodes}
            />
          </SelectGroup>
        </SelectContent>
      </Select>
    </FormControl>
  )
}

const RegionSelectorDescription = ({ options }: { options: RegionSelectorOptions }) => {
  if (options.isHighAvailabilityRestricted) {
    return (
      <div className="text-warning">
        High Availability projects are currently limited to {options.highAvailabilityRegionLabel}.
      </div>
    )
  }

  if (!showNonProdFields) return null

  return (
    <div className="text-warning">
      <p>Only these regions are supported for local/staging projects:</p>
      <ul className="list-disc list-inside mt-1">
        <li>East US (North Virginia)</li>
        <li>Central EU (Frankfurt)</li>
        <li>Southeast Asia (Singapore)</li>
      </ul>
      {isLocalEnvironment && (
        <p className="mt-1">Use Central EU (Frankfurt) unless you're on a personal dev stack.</p>
      )}
    </div>
  )
}

export const RegionSelector = ({
  form,
  hasSelectedOrganization,
  instanceSize,
  layout = 'horizontal',
  variant = 'control',
  isEmbedded = false,
}: RegionSelectorProps) => {
  const options = useRegionSelectorOptions({ form, hasSelectedOrganization, instanceSize })
  const { trackDisclosureOpened, trackSpecificRegionSelected } =
    useAdvancedRegionConfigTelemetry(variant)

  if (options.isError) {
    return <AlertError subject="Error loading available regions" error={options.error} />
  }

  const content = (
    <FormField
      control={form.control}
      name="dbRegion"
      render={({ field }) => {
        const controlProps: RegionSelectProps = {
          options,
          value: options.dbRegion,
          onChange: (value: string) => {
            if (value === '') return
            field.onChange(value)
          },
          triggerRef: field.ref,
          onDisclosureOpened: trackDisclosureOpened,
          onSpecificRegionSelected: trackSpecificRegionSelected,
        }

        const renderRegionControl = () => {
          if (variant === 'option_a') return <RegionSelectorOptionA {...controlProps} />
          if (variant === 'option_c') return <RegionSelectorOptionC {...controlProps} />
          return <RegionSelectControl {...controlProps} />
        }

        return (
          <>
            <FormItemLayout
              id="region"
              layout={layout}
              label="Region"
              description={<RegionSelectorDescription options={options} />}
            >
              {renderRegionControl()}
            </FormItemLayout>

            {options.isStatusPageEnabled && (
              <ProjectCreationStatusAdmonition selectedRegionCode={options.selectedRegion?.code} />
            )}

            {!options.isStatusPageEnabled && options.affectingIncidents.length > 0 && (
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

            {options.selectedRestrictionCopy !== undefined && (
              <FormItemLayout layout="horizontal" isReactForm={false}>
                <Admonition
                  type="warning"
                  title={options.selectedRestrictionCopy.title}
                  description={`${options.selectedRestrictionCopy.notice} ${SELECT_DIFFERENT_REGION}`}
                  className="mt-3"
                />
              </FormItemLayout>
            )}
          </>
        )
      }}
    />
  )

  if (isEmbedded) return content

  return <Panel.Content>{content}</Panel.Content>
}
