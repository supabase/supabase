import Link from 'next/link'
import { type RefObject } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { Button, buttonVariants, Card, CardContent, cn } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { DiskStorageSchemaType } from './DiskManagement.schema'
import { DiskConfigEditability } from './DiskManagement.types'
import { AutoScaleFields } from './fields/AutoScaleFields'
import {
  ComputeSectionBillingBadge,
  ComputeSizeField,
  ComputeSizeFieldMeta,
} from './fields/ComputeSizeField'
import { DiskSizeField } from './fields/DiskSizeField'
import { IOPSField } from './fields/IOPSField'
import { StorageTypeField } from './fields/StorageTypeField'
import { ThroughputField } from './fields/ThroughputField'
import { BillingChangeBadge } from './ui/BillingChangeBadge'
import { DiskCountdownRadial } from './ui/DiskCountdownRadial'
import { DiskType, SUPPORTED_DISK_CONFIG_UNDER_COST_GUARDRAIL } from './ui/DiskManagement.constants'
import { DiskSpaceBar } from './ui/DiskSpaceBar'
import { NoticeBar } from './ui/NoticeBar'
import { SpendCapDisabledSection } from './ui/SpendCapDisabledSection'
import { DocsButton } from '@/components/ui/DocsButton'
import { HighAvailabilityDisabledSectionNotice } from '@/components/ui/HighAvailability/HighAvailabilityDisabledSectionNotice'
import { RequestUpgradeToBillingOwners } from '@/components/ui/RequestUpgradeToBillingOwners'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { DOCS_URL } from '@/lib/constants'

interface ComputeSectionProps {
  form: UseFormReturn<DiskStorageSchemaType>
  settingsRef: RefObject<HTMLDivElement | null>
  showBillingBadge: boolean
  beforePrice: number
  afterPrice: number
  disabled: boolean
}

export function ComputeSection({
  form,
  settingsRef,
  showBillingBadge,
  beforePrice,
  afterPrice,
  disabled,
}: ComputeSectionProps) {
  return (
    <PageSection className="pt-0">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle className="heading-default text-base">Compute size</PageSectionTitle>
          <PageSectionDescription>
            <ComputeSizeFieldMeta />
          </PageSectionDescription>
        </PageSectionSummary>
        <PageSectionAside>
          <ComputeSectionBillingBadge
            form={form}
            show={showBillingBadge}
            beforePrice={beforePrice}
            afterPrice={afterPrice}
          />
          <DocsButton href={`${DOCS_URL}/guides/platform/compute-and-disk`} />
        </PageSectionAside>
      </PageSectionMeta>
      <PageSectionContent
        ref={settingsRef}
        id="compute"
        className="scroll-mt-24 flex flex-col gap-4"
      >
        <HighAvailabilityDisabledSectionNotice
          title="Compute size can't be changed on High Availability projects"
          description="High Availability projects run on a fixed compute size during Alpha. Contact support if this is blocking your work."
        />
        <ComputeSizeField form={form} disabled={disabled} />
      </PageSectionContent>
    </PageSection>
  )
}

interface DiskSectionProps {
  form: UseFormReturn<DiskStorageSchemaType>
  settingsRef: RefObject<HTMLDivElement | null>
  showBillingBadge: boolean
  beforePrice: number
  afterPrice: number
  isAws: boolean
  isAwsK8s: boolean
  isBranch: boolean
  isNoticeVisible: boolean
  isReadOnlyMode: boolean
  usedPercentage: number
  isWithinCooldownWindow: boolean
  currentDiskSizeGb?: number
  disableDiskSizeInput: boolean
}

function getDiskNoticeDescription({
  isAwsK8s,
  isBranch,
}: Pick<DiskSectionProps, 'isAwsK8s' | 'isBranch'>) {
  if (isAwsK8s) {
    return 'Configuring your disk for AWS (Revamped) projects is unavailable for now.'
  }
  if (isBranch) {
    return 'Delete and recreate your Preview Branch to configure disk size. It was deployed on an older branching infrastructure.'
  }
  return undefined
}

export function DiskSection({
  form,
  settingsRef,
  showBillingBadge,
  beforePrice,
  afterPrice,
  isAws,
  isAwsK8s,
  isBranch,
  isNoticeVisible,
  isReadOnlyMode,
  usedPercentage,
  isWithinCooldownWindow,
  currentDiskSizeGb,
  disableDiskSizeInput,
}: DiskSectionProps) {
  const noticeDescription = getDiskNoticeDescription({ isAwsK8s, isBranch })

  return (
    <PageSection id="disk-size">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle className="heading-default text-base">Disk</PageSectionTitle>
          <PageSectionDescription>
            Configure provisioned storage for your primary database.
          </PageSectionDescription>
        </PageSectionSummary>
        <PageSectionAside>
          <BillingChangeBadge
            show={showBillingBadge}
            beforePrice={beforePrice}
            afterPrice={afterPrice}
          />
          <DocsButton href={`${DOCS_URL}/guides/platform/database-size`} />
        </PageSectionAside>
      </PageSectionMeta>

      <HighAvailabilityDisabledSectionNotice title="Disk management is unavailable for High Availability projects" />

      <PageSectionContent ref={settingsRef} className="flex flex-col gap-4 scroll-mt-24">
        {isAws && <DiskSpaceBar form={form} />}

        <SpendCapDisabledSection currentDiskSizeGb={currentDiskSizeGb} />

        <NoticeBar
          type="default"
          visible={isNoticeVisible}
          title="Disk configuration is only available for projects in the AWS cloud provider"
          description={noticeDescription}
        />

        {isAws && (
          <>
            <div className="flex flex-col gap-y-3">
              <DiskCountdownRadial />
              {!isReadOnlyMode && usedPercentage >= 90 && isWithinCooldownWindow && (
                <Admonition
                  type="destructive"
                  title="Database size is currently over 90% of disk size"
                  description="Your project will enter read-only mode once you reach 95% of the disk space to prevent your database from exceeding the disk limitations"
                >
                  <DocsButton
                    abbrev={false}
                    className="mt-2"
                    href={`${DOCS_URL}/guides/platform/database-size#read-only-mode`}
                  />
                </Admonition>
              )}
              {isReadOnlyMode && (
                <Admonition
                  type="destructive"
                  title="Project is currently in read-only mode"
                  description="You will need to manually override read-only mode and reduce the database size to below 95% of the disk size"
                >
                  <DocsButton
                    abbrev={false}
                    className="mt-2"
                    href={`${DOCS_URL}/guides/platform/database-size#disabling-read-only-mode`}
                  />
                </Admonition>
              )}
            </div>

            <Card>
              <CardContent>
                <DiskSizeField form={form} disableInput={disableDiskSizeInput} />
              </CardContent>
            </Card>
          </>
        )}
      </PageSectionContent>
    </PageSection>
  )
}

interface AdvancedSectionProps {
  form: UseFormReturn<DiskStorageSchemaType>
  autoscaleSettingsRef: RefObject<HTMLDivElement | null>
  storageSettingsRef: RefObject<HTMLDivElement | null>
  showBillingBadge: boolean
  beforePrice: number
  afterPrice: number
  canUpdateDiskConfiguration: boolean
  isDiskTooSmallForIopsOrThroughput: boolean
  disableDiskInputs: boolean
  disableDiskSizeInput: boolean
  suggestedDiskSizeForCustomIops: number
  diskConfigEditability: DiskConfigEditability
  provisionedStorageType?: DiskType
}

export function AdvancedSection({
  form,
  autoscaleSettingsRef,
  storageSettingsRef,
  showBillingBadge,
  beforePrice,
  afterPrice,
  canUpdateDiskConfiguration,
  isDiskTooSmallForIopsOrThroughput,
  disableDiskInputs,
  disableDiskSizeInput,
  suggestedDiskSizeForCustomIops,
  diskConfigEditability,
  provisionedStorageType,
}: AdvancedSectionProps) {
  const { data: org } = useSelectedOrganizationQuery()
  const canEditDiskConfig = diskConfigEditability.status !== 'locked'
  const isDownsizeOnly = diskConfigEditability.status === 'downsizeOnly'
  const activeGuardrails =
    diskConfigEditability.status === 'editable' ? [] : diskConfigEditability.guardrails
  const isLockedByComputeSize =
    diskConfigEditability.status === 'locked' && activeGuardrails.includes('computeSize')

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle className="heading-default text-base">Advanced</PageSectionTitle>
          <PageSectionDescription>
            Configure autoscaling, storage type, IOPS, and throughput.
          </PageSectionDescription>
        </PageSectionSummary>
        <PageSectionAside>
          <BillingChangeBadge
            show={showBillingBadge}
            beforePrice={beforePrice}
            afterPrice={afterPrice}
          />
        </PageSectionAside>
      </PageSectionMeta>
      <PageSectionContent className="flex flex-col gap-4">
        <Card ref={autoscaleSettingsRef} className="scroll-mt-24">
          <CardContent className="flex flex-col gap-y-8">
            <AutoScaleFields form={form} disableInput={disableDiskInputs && disableDiskSizeInput} />
          </CardContent>
        </Card>

        <Card ref={storageSettingsRef} className="scroll-mt-24">
          <CardContent className="flex flex-col gap-y-8">
            <NoticeBar
              type="default"
              visible={isLockedByComputeSize}
              title="Adjusting disk configuration requires Large compute size or above"
              description={`Increase your compute size to adjust your disk's storage type, ${form.getValues('storageType') === 'gp3' ? 'IOPS, ' : ''} and throughput`}
              actions={
                canUpdateDiskConfiguration ? (
                  <Button
                    variant="default"
                    onClick={() => {
                      form.setValue('computeSize', 'ci_large', {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                      form.trigger('provisionedIOPS')
                      form.trigger('throughput')
                    }}
                  >
                    Change to Large compute
                  </Button>
                ) : (
                  <RequestUpgradeToBillingOwners
                    addon="computeSize"
                    featureProposition="adjust disk configuration"
                  />
                )
              }
            />
            <NoticeBar
              type="default"
              visible={isDownsizeOnly}
              title="Storage type, IOPS, or throughput exceeds what's currently supported"
              description="These settings are provisioned above what your current compute size or spend cap allows. You can lower storage type, IOPS, and throughput. To raise them, disable spend cap and upgrade to Large compute as necessary."
              actions={
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="default"
                    onClick={() => {
                      form.setValue(
                        'storageType',
                        SUPPORTED_DISK_CONFIG_UNDER_COST_GUARDRAIL.storageType,
                        { shouldDirty: true, shouldValidate: true }
                      )
                      form.setValue(
                        'provisionedIOPS',
                        SUPPORTED_DISK_CONFIG_UNDER_COST_GUARDRAIL.provisionedIOPS,
                        { shouldDirty: true, shouldValidate: true }
                      )
                      form.setValue(
                        'throughput',
                        SUPPORTED_DISK_CONFIG_UNDER_COST_GUARDRAIL.throughput,
                        { shouldDirty: true, shouldValidate: true }
                      )
                    }}
                  >
                    Reset to supported configuration
                  </Button>
                  {activeGuardrails.includes('computeSize') && canUpdateDiskConfiguration && (
                    <Button
                      variant="default"
                      onClick={() => {
                        form.setValue('computeSize', 'ci_large', {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                        form.trigger('provisionedIOPS')
                        form.trigger('throughput')
                      }}
                    >
                      Change to Large compute
                    </Button>
                  )}
                  {activeGuardrails.includes('spendCap') && (
                    <Link
                      href={`/org/${org?.slug}/billing?panel=costControl`}
                      className={cn(buttonVariants({ variant: 'default', size: 'tiny' }))}
                    >
                      Disable spend cap
                    </Link>
                  )}
                </div>
              }
            />
            <NoticeBar
              type="default"
              visible={isDiskTooSmallForIopsOrThroughput && canEditDiskConfig}
              title="Increase disk size to adjust IOPS or throughput"
              description={`This disk is too small to update IOPS or throughput, since gp3 volumes are capped at 500 IOPS per GB with a 3,000 IOPS minimum. Resizing to ${suggestedDiskSizeForCustomIops} GB unlocks custom IOPS and throughput, and leaves headroom for further adjustments (disk config changes are limited to 4 within a rolling 24-hour window).`}
              actions={
                !disableDiskSizeInput ? (
                  <Button
                    variant="default"
                    onClick={() => {
                      form.setValue('totalSize', suggestedDiskSizeForCustomIops, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }}
                  >
                    Increase to {suggestedDiskSizeForCustomIops} GB
                  </Button>
                ) : undefined
              }
            />
            <StorageTypeField
              form={form}
              disableInput={!canEditDiskConfig}
              downsizeOnly={isDownsizeOnly}
              provisionedStorageType={provisionedStorageType}
            />
            <IOPSField
              form={form}
              disableInput={!canEditDiskConfig || isDiskTooSmallForIopsOrThroughput}
            />
            <ThroughputField
              form={form}
              disableInput={!canEditDiskConfig || isDiskTooSmallForIopsOrThroughput}
            />
          </CardContent>
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}
