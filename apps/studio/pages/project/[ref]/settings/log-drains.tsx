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
import { useEffect, useState } from 'react'
import { LogDrainType } from 'components/interfaces/LogDrains/LogDrains.constants'
import { LogDrainData } from 'data/log-drains/log-drains-query'
import { useCreateLogDrainMutation } from 'data/log-drains/create-log-drain-mutation'
import toast from 'react-hot-toast'
import {
  LogDrainUpdateVariables,
  useUpdateLogDrainMutation,
} from 'data/log-drains/update-log-drain-mutation'
import { useParams } from 'common'

const LogDrainsSettings: NextPageWithLayout = () => {
  const [open, setOpen] = useState(false)
  const { ref } = useParams() as { ref: string }
  const [selectedLogDrain, setSelectedLogDrain] = useState<Partial<LogDrainData> | null>(null)
  const [mode, setMode] = useState<'create' | 'update'>('create')

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
      toast.success('Log drain destination updated')
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
          <div className="flex items-center justify-end">
            <Button
              onClick={() => {
                setSelectedLogDrain(null)
                setMode('create')
                setOpen(true)
              }}
              type="primary"
            >
              Add destination
            </Button>
          </div>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer className="flex flex-col gap-10" bottomPadding>
        <LogDrainDestinationSheetForm
          open={open}
          onOpenChange={(v) => {
            if (!v) {
              setSelectedLogDrain(null)
            }
            setOpen(v)
          }}
          defaultValues={selectedLogDrain as any}
          isLoading={isLoading}
          onSubmit={({ name, type, ...values }) => {
            const logDrainValues = {
              name,
              type,
              config: values as any, // TODO: fix generated API types from backend
              id: selectedLogDrain?.id,
              projectRef: ref,
            }

            if (mode === 'create') {
              createLogDrain(logDrainValues)
            } else {
              if (!logDrainValues.id) {
                throw new Error('Log drain ID is required')
              } else {
                if (!selectedLogDrain?.token) {
                  throw new Error('Log drain token is required')
                }
                updateLogDrain({
                  ...logDrainValues,
                  token: selectedLogDrain?.token,
                })
              }
            }
          }}
        />
        <LogDrains onUpdateDrainClick={handleUpdateClick} onNewDrainClick={handleNewClick} />
      </ScaffoldContainer>
    </>
  )
}

LogDrainsSettings.getLayout = (page) => <SettingsLayout title="Log Drains">{page}</SettingsLayout>
export default LogDrainsSettings
