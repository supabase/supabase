import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'
import { LogDrains } from 'components/interfaces/LogDrains/LogDrains'
import { LogDrainDestinationSheetForm } from 'components/interfaces/LogDrains/LogDrainDestinationSheetForm'
import { Button } from 'ui'
import { useState } from 'react'
import { LOG_DRAIN_TYPES, LogDrainType } from 'components/interfaces/LogDrains/LogDrains.constants'
import { LogDrainData, useLogDrainsQuery } from 'data/log-drains/log-drains-query'
import { useCreateLogDrainMutation } from 'data/log-drains/create-log-drain-mutation'
import toast from 'react-hot-toast'
import { useUpdateLogDrainMutation } from 'data/log-drains/update-log-drain-mutation'
import { useParams } from 'common'
import { useCurrentOrgPlan } from 'hooks/misc/useCurrentOrgPlan'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Alert } from '@ui/components/shadcn/ui/alert'

const LogDrainsSettings: NextPageWithLayout = () => {
  const canManageLogDrains = useCheckPermissions(PermissionAction.ANALYTICS_WRITE, 'logflare')

  const [open, setOpen] = useState(false)
  const { ref } = useParams() as { ref: string }
  const [selectedLogDrain, setSelectedLogDrain] = useState<Partial<LogDrainData> | null>(null)
  const [mode, setMode] = useState<'create' | 'update'>('create')

  const { plan, isLoading: planLoading } = useCurrentOrgPlan()

  const logDrainsEnabled = !planLoading && (plan?.id === 'team' || plan?.id === 'enterprise')

  const { data: logDrains } = useLogDrainsQuery(
    { ref },
    {
      enabled: logDrainsEnabled,
    }
  )

  const { mutate: createLogDrain, isLoading: createLoading } = useCreateLogDrainMutation({
    onSuccess: () => {
      toast.success('Log drain destination created')
      setOpen(false)
    },
    onError: () => {
      toast.error('Failed to create log drain')
      setOpen(false)
    },
  })

  const { mutate: updateLogDrain, isLoading: updateLoading } = useUpdateLogDrainMutation({
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

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldHeader className="flex flex-row justify-between">
          <div>
            <ScaffoldTitle>Log Drains</ScaffoldTitle>
            <ScaffoldDescription>
              Send your project logs to third party destinations
            </ScaffoldDescription>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button type="default" icon={<ExternalLink strokeWidth={1.5} />} asChild>
              <Link
                target="_blank"
                rel="noreferrer"
                href="https://supabase.com/docs/guides/platform/log-drains"
              >
                Documentation
              </Link>
            </Button>
            {!(logDrains?.length === 0) && (
              <Button
                disabled={!logDrainsEnabled || !canManageLogDrains}
                onClick={() => {
                  setSelectedLogDrain(null)
                  setMode('create')
                  setOpen(true)
                }}
                type="primary"
              >
                Add destination
              </Button>
            )}
          </div>
        </ScaffoldHeader>
      </ScaffoldContainer>
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
            type: selectedLogDrain?.type || 'webhook',
            ...selectedLogDrain,
          }}
          isLoading={isLoading}
          onSubmit={({ name, type, ...values }) => {
            const logDrainValues = {
              name,
              type,
              config: values as any, // TODO: fix generated API types from backend
              id: selectedLogDrain?.id,
              projectRef: ref,
              token: selectedLogDrain?.token,
            }

            if (mode === 'create') {
              createLogDrain(logDrainValues)
            } else {
              if (!logDrainValues.id || !selectedLogDrain?.token) {
                throw new Error('Log drain ID and token is required')
              } else {
                updateLogDrain(logDrainValues)
              }
            }
          }}
        />
        {canManageLogDrains ? (
          <LogDrains onUpdateDrainClick={handleUpdateClick} onNewDrainClick={handleNewClick} />
        ) : (
          <Alert variant="default">You do not have permission to manage log drains</Alert>
        )}
      </ScaffoldContainer>
    </>
  )
}

LogDrainsSettings.getLayout = (page) => <SettingsLayout title="Log Drains">{page}</SettingsLayout>
export default LogDrainsSettings
