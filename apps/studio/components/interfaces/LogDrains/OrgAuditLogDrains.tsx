import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM, useParams } from 'common'
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

import { LogDrainDestinationSheetForm } from './LogDrainDestinationSheetForm'
import { LogDrainType } from './LogDrains.constants'
import { LogDrainsList } from './LogDrainsList'
import { useEnabledLogDrainTypes } from './useEnabledLogDrainTypes'
import { Shortcut } from '@/components/ui/Shortcut'
import { UpgradePlanButton } from '@/components/ui/UpgradePlanButton'
import { useAuditLogDrainsQuery } from '@/data/log-drains/audit-log-drains-query'
import {
  AuditLogDrainConfig,
  AuditLogDrainCreateVariables,
  useCreateAuditLogDrainMutation,
} from '@/data/log-drains/create-audit-log-drain-mutation'
import { useDeleteAuditLogDrainMutation } from '@/data/log-drains/delete-audit-log-drain-mutation'
import { LogDrainData } from '@/data/log-drains/log-drains-query'
import { useTestAuditLogDrainMutation } from '@/data/log-drains/test-audit-log-drain-mutation'
import { useUpdateAuditLogDrainMutation } from '@/data/log-drains/update-audit-log-drain-mutation'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useTrack } from '@/lib/telemetry/track'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

export function OrgAuditLogDrains() {
  const { slug } = useParams() as { slug: string }
  const track = useTrack()

  const { can: canManageLogDrains, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.ANALYTICS_ADMIN_WRITE,
    'logflare'
  )

  const { hasAccess: hasAccessToLogDrains, isLoading: isLoadingEntitlement } = useCheckEntitlements(
    'audit_log_drains',
    slug
  )

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'update'>('create')
  const [selectedLogDrain, setSelectedLogDrain] = useState<Partial<LogDrainData> | null>(null)
  const [isCreateConfirmModalOpen, setIsCreateConfirmModalOpen] = useState(false)
  const [pendingLogDrainValues, setPendingLogDrainValues] =
    useState<AuditLogDrainCreateVariables | null>(null)

  const enabledDrainTypes = useEnabledLogDrainTypes()

  const {
    data: logDrains,
    isPending: isLoadingDrains,
    error,
    isError,
  } = useAuditLogDrainsQuery({ slug }, { enabled: !isLoadingEntitlement && hasAccessToLogDrains })

  const { mutate: createLogDrain, isPending: createLoading } = useCreateAuditLogDrainMutation({
    onSuccess: () => {
      toast.success('Audit log drain destination created')
      setPendingLogDrainValues(null)
      setIsCreateConfirmModalOpen(false)
      setOpen(false)
    },
    onError: () => {
      toast.error('Failed to create audit log drain')
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

  const { mutate: deleteLogDrain, isPending: isDeleting } = useDeleteAuditLogDrainMutation({
    onError: () => {
      toast.error('Failed to delete audit log drain')
    },
  })

  const { mutate: testLogDrain } = useTestAuditLogDrainMutation({
    onSuccess: () => {
      toast.success('Audit log drain connection test succeeded')
    },
  })

  const isLoading = createLoading || updateLoading

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

  if (isLoadingPermissions || isLoadingEntitlement) {
    return <GenericSkeletonLoader />
  }

  if (!hasAccessToLogDrains) {
    return (
      <div className="flex flex-col items-center gap-4 rounded border border-dashed py-12 px-6 text-center">
        <div className="flex flex-col gap-1">
          <p className="text-foreground">Audit log drains are not available on your plan</p>
          <p className="text-sm text-foreground-light">
            Upgrade to a Team or Enterprise Plan to export your organization audit logs to your
            preferred destination.
          </p>
        </div>
        <UpgradePlanButton
          plan="Team"
          source="audit-log-drains-empty-state"
          featureProposition="use Audit Log Drains"
        />
      </div>
    )
  }

  if (!canManageLogDrains) {
    return <Alert variant="default">You do not have permission to manage audit log drains</Alert>
  }

  return (
    <div className="flex flex-col gap-6">
      {!!logDrains?.length && (
        <div className="flex items-center justify-end">
          <div className="flex items-center">
            <Shortcut
              id={SHORTCUT_IDS.LOG_DRAINS_ADD_DESTINATION}
              onTrigger={handleAddDestinationClick}
              options={{ enabled: canManageLogDrains }}
              side="bottom"
              tooltipOpen={open ? false : undefined}
            >
              <Button
                disabled={!canManageLogDrains}
                onClick={handleAddDestinationClick}
                variant="primary"
                className="rounded-r-none px-3"
              >
                Add destination
              </Button>
            </Shortcut>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="primary"
                  title="Choose destination type"
                  className="rounded-l-none px-[4px] py-[5px]"
                  icon={<ChevronDown />}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom">
                {enabledDrainTypes.map((drainType) => (
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
        </div>
      )}

      <LogDrainDestinationSheetForm
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
        existingDrainNames={(logDrains ?? []).map((drain) => drain.name)}
        onSaveClick={(type) => {
          track('audit_log_drain_save_button_clicked', { destination: type })
        }}
        onSubmit={({ name, description, type, ...values }) => {
          const logDrainValues = {
            name,
            description: description || '',
            type,
            config: values as AuditLogDrainConfig,
            id: selectedLogDrain?.id,
            slug,
            token: selectedLogDrain?.token,
          }

          if (mode === 'create') {
            setPendingLogDrainValues(logDrainValues)
            setIsCreateConfirmModalOpen(true)
          } else {
            if (!selectedLogDrain?.token) {
              toast.error('Audit log drain token is required')
              return
            }
            updateLogDrain(logDrainValues)
          }
        }}
      />

      <LogDrainsList
        logDrains={logDrains}
        isLoading={isLoadingDrains}
        isError={isError}
        error={error}
        isDeleting={isDeleting}
        onNewDrainClick={handleNewClick}
        onDeleteDrain={(drain) => {
          deleteLogDrain({ token: drain.token, slug })
          track('audit_log_drain_removed', { destination: drain.type })
        }}
        onTestDrain={(drain) => testLogDrain({ token: drain.token, slug })}
      />

      <ConfirmationModal
        confirmLabel="Add destination"
        variant="default"
        title="Confirm Audit Log Drain Creation"
        visible={isCreateConfirmModalOpen}
        loading={createLoading}
        onConfirm={() => {
          if (pendingLogDrainValues && !createLoading) {
            createLogDrain(pendingLogDrainValues)
          }
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
    </div>
  )
}
