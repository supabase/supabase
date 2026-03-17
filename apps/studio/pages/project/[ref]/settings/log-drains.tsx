import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM, useFlag, useParams } from 'common'
import { LogDrainDestinationSheetForm } from 'components/interfaces/LogDrains/LogDrainDestinationSheetForm'
import { LogDrains } from 'components/interfaces/LogDrains/LogDrains'
import { LOG_DRAIN_TYPES, LogDrainType } from 'components/interfaces/LogDrains/LogDrains.constants'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import {
  LogDrainCreateVariables,
  useCreateLogDrainMutation,
} from 'data/log-drains/create-log-drain-mutation'
import { LogDrainData, useLogDrainsQuery } from 'data/log-drains/log-drains-query'
import { useUpdateLogDrainMutation } from 'data/log-drains/update-log-drain-mutation'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { DOCS_URL } from 'lib/constants'
import { ChevronDown } from 'lucide-react'
import { cloneElement, useState } from 'react'
import { toast } from 'sonner'
import type { NextPageWithLayout } from 'types'
import {
  Alert_Shadcn_,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

const LogDrainsSettings: NextPageWithLayout = () => {
  const { can: canManageLogDrains, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.ANALYTICS_ADMIN_WRITE,
    'logflare'
  )

  const [open, setOpen] = useState(false)
  const { ref } = useParams() as { ref: string }
  const [selectedLogDrain, setSelectedLogDrain] = useState<Partial<LogDrainData> | null>(null)
  const [isCreateConfirmModalOpen, setIsCreateConfirmModalOpen] = useState(false)
  const [pendingLogDrainValues, setPendingLogDrainValues] =
    useState<LogDrainCreateVariables | null>(null)
  const [mode, setMode] = useState<'create' | 'update'>('create')

  const { hasAccess: hasAccessToLogDrains, isLoading: isLoadingEntitlement } =
    useCheckEntitlements('log_drains')

  const sentryEnabled = useFlag('SentryLogDrain')
  const s3Enabled = useFlag('S3logdrain')
  const axiomEnabled = useFlag('axiomLogDrain')
  const otlpEnabled = useFlag('otlpLogDrain')
  const last9Enabled = useFlag('Last9LogDrain')

  const { data: logDrains } = useLogDrainsQuery(
    { ref },
    { enabled: !isLoadingEntitlement && hasAccessToLogDrains }
  )

  const { mutate: createLogDrain, isPending: createLoading } = useCreateLogDrainMutation({
    onSuccess: () => {
      toast.success('Log drain destination created')
      setIsCreateConfirmModalOpen(false)
      setOpen(false)
    },
    onError: () => {
      toast.error('Failed to create log drain')
      setIsCreateConfirmModalOpen(false)
      setOpen(false)
    },
  })

  const { mutate: updateLogDrain, isPending: updateLoading } = useUpdateLogDrainMutation({
    onSuccess: () => {
      toast.success('Log drain updated')
      setOpen(false)
    },
    onError: () => {
      setOpen(false)
      toast.error('Failed to update log drain')
    },
  })

  const isLoading = createLoading || updateLoading

  function handleUpdateClick(drain: LogDrainData) {
    setSelectedLogDrain(drain)
    setMode('update')
    setOpen(true)
  }

  function handleNewClick(src: LogDrainType) {
    setSelectedLogDrain({ type: src })
    setMode('create')
    setOpen(true)
  }

  const content = (
    <ScaffoldSection isFullWidth id="log-drains" className="gap-6">
      <ScaffoldContainer className="flex flex-col gap-10" bottomPadding>
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
          onSubmit={({ name, description, type, ...values }) => {
            const logDrainValues = {
              name,
              description: description || '',
              type,
              config: values as any, // TODO: fix generated API types from backend
              id: selectedLogDrain?.id,
              projectRef: ref,
              token: selectedLogDrain?.token,
            }

            if (mode === 'create') {
              setPendingLogDrainValues(logDrainValues)
              setIsCreateConfirmModalOpen(true)
            } else {
              if (!logDrainValues.id || !selectedLogDrain?.token) {
                throw new Error('Log drain ID and token is required')
              } else {
                updateLogDrain(logDrainValues)
              }
            }
          }}
        />

        {isLoadingPermissions ? (
          <GenericSkeletonLoader />
        ) : !canManageLogDrains ? (
          <Alert_Shadcn_ variant="default">
            You do not have permission to manage log drains
          </Alert_Shadcn_>
        ) : (
          <LogDrains onUpdateDrainClick={handleUpdateClick} onNewDrainClick={handleNewClick} />
        )}
      </ScaffoldContainer>

      <ConfirmationModal
        confirmLabel="Add destination"
        variant="default"
        title="Confirm Log Drain Creation"
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
            You are about to create a new log drain destination:{' '}
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
    </ScaffoldSection>
  )

  // [kemal]: Ordinarily <PageLayout /> would be bundled with the getLayout function below, however in this case we need access to some bits for the "Add destination" button to render as part of the in-built page header in <PageLayout />.
  if (!isLoadingEntitlement && hasAccessToLogDrains) {
    return (
      <PageLayout
        title="Log Drains"
        subtitle="Send your project logs to third party destinations"
        primaryActions={
          <>
            {!(logDrains?.length === 0) && (
              <div className="flex items-center">
                <Button
                  disabled={!hasAccessToLogDrains || !canManageLogDrains}
                  onClick={() => {
                    setSelectedLogDrain(null)
                    setMode('create')
                    setOpen(true)
                  }}
                  type="primary"
                  className="rounded-r-none px-3"
                >
                  Add destination
                </Button>
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
          </>
        }
        secondaryActions={<DocsButton href={`${DOCS_URL}/guides/platform/log-drains`} />}
      >
        {content}
      </PageLayout>
    )
  }

  return content
}

LogDrainsSettings.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="Log Drains">{page}</SettingsLayout>
  </DefaultLayout>
)

export default LogDrainsSettings
