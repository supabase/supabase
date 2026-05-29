import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM, useFlag, useParams } from 'common'
import { ChevronDown } from 'lucide-react'
import { cloneElement, useState } from 'react'
import { toast } from 'sonner'
import {
  Alert,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import { AuditLogDrainDestinationSheetForm } from '@/components/interfaces/AuditLogDrains/AuditLogDrainDestinationSheetForm'
import { AuditLogDrains } from '@/components/interfaces/AuditLogDrains/AuditLogDrains'
import {
  LOG_DRAIN_TYPES,
  LogDrainType,
} from '@/components/interfaces/LogDrains/LogDrains.constants'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import OrganizationLayout from '@/components/layouts/OrganizationLayout'
import { OrganizationSettingsLayout } from '@/components/layouts/ProjectLayout/OrganizationSettingsLayout'
import { ScaffoldContainer, ScaffoldSection } from '@/components/layouts/Scaffold'
import { DocsButton } from '@/components/ui/DocsButton'
import { Shortcut } from '@/components/ui/Shortcut'
import {
  AuditLogDrainData,
  useAuditLogDrainsQuery,
} from '@/data/audit-log-drains/audit-log-drains-query'
import {
  AuditLogDrainCreateVariables,
  useCreateAuditLogDrainMutation,
} from '@/data/audit-log-drains/create-audit-log-drain-mutation'
import { useUpdateAuditLogDrainMutation } from '@/data/audit-log-drains/update-audit-log-drain-mutation'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { DOCS_URL } from '@/lib/constants'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import type { NextPageWithLayout } from '@/types'

const AuditLogDrainsSettings: NextPageWithLayout = () => {
  const { can: canManageLogDrains, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.ANALYTICS_ADMIN_WRITE,
    'logflare'
  )

  const [open, setOpen] = useState(false)
  const { slug } = useParams() as { slug: string }
  const [selectedLogDrain, setSelectedLogDrain] = useState<Partial<AuditLogDrainData> | null>(null)
  const [isCreateConfirmModalOpen, setIsCreateConfirmModalOpen] = useState(false)
  const [pendingLogDrainValues, setPendingLogDrainValues] =
    useState<AuditLogDrainCreateVariables | null>(null)
  const [mode, setMode] = useState<'create' | 'update'>('create')

  const { hasAccess: hasAccessToLogDrains, isLoading: isLoadingEntitlement } =
    useCheckEntitlements('log_drains')

  const sentryEnabled = useFlag('SentryLogDrain')
  const s3Enabled = useFlag('S3logdrain')
  const axiomEnabled = useFlag('axiomLogDrain')
  const otlpEnabled = useFlag('otlpLogDrain')
  const last9Enabled = useFlag('Last9LogDrain')
  const syslogEnabled = useFlag('syslogLogDrain')

  const { data: logDrains } = useAuditLogDrainsQuery(
    { slug },
    { enabled: !isLoadingEntitlement && hasAccessToLogDrains }
  )

  const { mutate: createLogDrain, isPending: createLoading } = useCreateAuditLogDrainMutation({
    onSuccess: () => {
      toast.success('Audit log drain destination created')
      setIsCreateConfirmModalOpen(false)
      setOpen(false)
    },
    onError: () => {
      toast.error('Failed to create audit log drain')
      setIsCreateConfirmModalOpen(false)
      setOpen(false)
    },
  })

  const { mutate: updateLogDrain, isPending: updateLoading } = useUpdateAuditLogDrainMutation({
    onSuccess: () => {
      toast.success('Audit log drain updated')
      setOpen(false)
    },
    onError: () => {
      setOpen(false)
      toast.error('Failed to update audit log drain')
    },
  })

  const isLoading = createLoading || updateLoading

  function handleUpdateClick(drain: AuditLogDrainData) {
    setSelectedLogDrain(drain)
    setMode('update')
    setOpen(true)
  }

  function handleNewClick(src: LogDrainType) {
    setSelectedLogDrain({ type: src })
    setMode('create')
    setOpen(true)
  }

  function handleAddDestinationClick() {
    setSelectedLogDrain(null)
    setMode('create')
    setOpen(true)
  }

  const showAddDestination = !isLoadingEntitlement && hasAccessToLogDrains && !!logDrains?.length

  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Audit Log Drains</PageHeaderTitle>
            <PageHeaderDescription>
              Send your organization audit logs to third party destinations
            </PageHeaderDescription>
          </PageHeaderSummary>
          <PageHeaderAside>
            <DocsButton href={`${DOCS_URL}/guides/platform/log-drains`} />
            {showAddDestination && (
              <div className="flex items-center">
                <Shortcut
                  id={SHORTCUT_IDS.AUDIT_LOG_DRAINS_ADD_DESTINATION}
                  onTrigger={handleAddDestinationClick}
                  options={{ enabled: hasAccessToLogDrains && canManageLogDrains }}
                  side="bottom"
                  tooltipOpen={open ? false : undefined}
                >
                  <Button
                    disabled={!hasAccessToLogDrains || !canManageLogDrains}
                    onClick={handleAddDestinationClick}
                    type="primary"
                    className="rounded-r-none px-3"
                  >
                    Add destination
                  </Button>
                </Shortcut>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="primary"
                      title="Choose token scope"
                      className="rounded-l-none px-[4px] py-[5px]"
                      icon={<ChevronDown />}
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" side="bottom">
                    {LOG_DRAIN_TYPES.filter((t) => {
                      if (t.value === 'sentry') return sentryEnabled
                      if (t.value === 's3') return s3Enabled
                      if (t.value === 'axiom') return axiomEnabled
                      if (t.value === 'otlp') return otlpEnabled
                      if (t.value === 'last9') return last9Enabled
                      if (t.value === 'syslog') return syslogEnabled
                      return true
                    }).map((drainType) => (
                      <DropdownMenuItem
                        key={drainType.value}
                        onClick={() => handleNewClick(drainType.value)}
                      >
                        <div className="flex items-center gap-3">
                          {cloneElement(drainType.icon, { height: 16, width: 16 })}
                          <div className="space-y-1">
                            <p className="block text-foreground">{drainType.name}</p>
                            {IS_PLATFORM && (
                              <p className="text-xs text-foreground-lighter">Additional $60</p>
                            )}
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>

      <AuditLogDrainDestinationSheetForm
        mode={mode}
        open={open}
        onOpenChange={(v) => {
          if (!v) {
            setSelectedLogDrain(null)
          }
          setOpen(v)
        }}
        defaultValues={{
          ...selectedLogDrain,
          type: selectedLogDrain?.type ? selectedLogDrain.type : 'webhook',
        }}
        isLoading={isLoading}
        onSubmit={({ name, description, type, ...values }) => {
          const logDrainValues = {
            name,
            description: description || '',
            type,
            config: values as any, // TODO: fix generated API types from backend
            id: selectedLogDrain?.id,
            slug,
            token: selectedLogDrain?.token,
          }

          if (mode === 'create') {
            setPendingLogDrainValues(logDrainValues)
            setIsCreateConfirmModalOpen(true)
          } else {
            if (!logDrainValues.id || !selectedLogDrain?.token) {
              throw new Error('Audit log drain ID and token is required')
            } else {
              updateLogDrain(logDrainValues)
            }
          }
        }}
      />

      <ScaffoldSection isFullWidth id="audit-log-drains" className="gap-6">
        <ScaffoldContainer className="flex flex-col gap-10" bottomPadding>
          {isLoadingPermissions ? (
            <GenericSkeletonLoader />
          ) : !canManageLogDrains ? (
            <Alert variant="default">You do not have permission to manage audit log drains</Alert>
          ) : (
            <AuditLogDrains
              onUpdateDrainClick={handleUpdateClick}
              onNewDrainClick={handleNewClick}
            />
          )}
        </ScaffoldContainer>
      </ScaffoldSection>

      <ConfirmationModal
        confirmLabel="Add destination"
        variant="default"
        title="Confirm Audit Log Drain Creation"
        visible={isCreateConfirmModalOpen}
        onConfirm={() => {
          if (pendingLogDrainValues) {
            createLogDrain(pendingLogDrainValues)
            setPendingLogDrainValues(null)
          }
          setIsCreateConfirmModalOpen(false)
        }}
        onCancel={() => {
          setIsCreateConfirmModalOpen(false)
          setPendingLogDrainValues(null)
        }}
      >
        <div className="text-foreground-light text-sm space-y-2">
          <p>
            You are about to create a new audit log drain destination:{' '}
            <span className="text-foreground">{pendingLogDrainValues?.name}</span>
          </p>
          {IS_PLATFORM && (
            <p>
              This will incur an additional <span className="text-foreground">$60 per month</span>{' '}
              charge to your subscription.
            </p>
          )}
          <p>Are you sure you want to proceed?</p>
        </div>
      </ConfirmationModal>
    </>
  )
}

AuditLogDrainsSettings.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout title="Audit Log Drains">
      <OrganizationSettingsLayout>{page}</OrganizationSettingsLayout>
    </OrganizationLayout>
  </DefaultLayout>
)

export default AuditLogDrainsSettings
