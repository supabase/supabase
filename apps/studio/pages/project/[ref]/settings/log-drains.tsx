import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { LogDrainDestinationSheetForm } from 'components/interfaces/LogDrains/LogDrainDestinationSheetForm'
import { LogDrains } from 'components/interfaces/LogDrains/LogDrains'
import { LogDrainType } from 'components/interfaces/LogDrains/LogDrains.constants'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import { useCreateLogDrainMutation } from 'data/log-drains/create-log-drain-mutation'
import { LogDrainData, useLogDrainsQuery } from 'data/log-drains/log-drains-query'
import { useUpdateLogDrainMutation } from 'data/log-drains/update-log-drain-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useCurrentOrgPlan } from 'hooks/misc/useCurrentOrgPlan'
import type { NextPageWithLayout } from 'types'
import { Alert_Shadcn_, Button } from 'ui'

const LogDrainsSettings: NextPageWithLayout = () => {
  const canManageLogDrains = useCheckPermissions(PermissionAction.ANALYTICS_ADMIN_WRITE, 'logflare')

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
            <DocsButton href="https://supabase.com/docs/guides/platform/log-drains" />

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
          <Alert_Shadcn_ variant="default">
            You do not have permission to manage log drains
          </Alert_Shadcn_>
        )}
      </ScaffoldContainer>
    </>
  )
}

LogDrainsSettings.getLayout = (page) => <SettingsLayout title="Log Drains">{page}</SettingsLayout>
export default LogDrainsSettings
