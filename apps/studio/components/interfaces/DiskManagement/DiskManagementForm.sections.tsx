import { type RefObject } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { Button, Card, CardContent } from 'ui'
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
import { DiskSpaceBar } from './ui/DiskSpaceBar'
import { NoticeBar } from './ui/NoticeBar'
import { SpendCapDisabledSection } from './ui/SpendCapDisabledSection'
import { DocsButton } from '@/components/ui/DocsButton'
import { RequestUpgradeToBillingOwners } from '@/components/ui/RequestUpgradeToBillingOwners'
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
      <PageSectionContent ref={settingsRef} id="compute" className="scroll-mt-24">
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
  disableIopsThroughputConfig?: boolean
  canUpdateDiskConfiguration: boolean
  isDiskTooSmallForCustomIops: boolean
  disableDiskInputs: boolean
  disableDiskSizeInput: boolean
  suggestedDiskSizeForCustomIops: number
}

export function AdvancedSection({
  form,
  autoscaleSettingsRef,
  storageSettingsRef,
  showBillingBadge,
  beforePrice,
  afterPrice,
  disableIopsThroughputConfig,
  canUpdateDiskConfiguration,
  isDiskTooSmallForCustomIops,
  disableDiskInputs,
  disableDiskSizeInput,
  suggestedDiskSizeForCustomIops,
}: AdvancedSectionProps) {
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
            <AutoScaleFields form={form} />
          </CardContent>
        </Card>

        <Card ref={storageSettingsRef} className="scroll-mt-24">
          <CardContent className="flex flex-col gap-y-8">
            <NoticeBar
              type="default"
              visible={!!disableIopsThroughputConfig}
              title="Adjusting disk configuration requires LARGE Compute size or above"
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
                    Change to LARGE Compute
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
              visible={
                isDiskTooSmallForCustomIops && !disableIopsThroughputConfig && !disableDiskInputs
              }
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
              disableInput={!!disableIopsThroughputConfig || disableDiskInputs}
            />
            <IOPSField
              form={form}
              disableInput={
                !!disableIopsThroughputConfig || disableDiskInputs || isDiskTooSmallForCustomIops
              }
            />
            <ThroughputField
              form={form}
              disableInput={
                !!disableIopsThroughputConfig || disableDiskInputs || isDiskTooSmallForCustomIops
              }
            />
          </CardContent>
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}
