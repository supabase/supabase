import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import {
  ScaffoldContainer,
  ScaffoldDescription,
  ScaffoldHeader,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import type { NextPageWithLayout } from 'types'
import { LogDrains } from 'components/interfaces/LogDrains/LogDrains'
import { CreateLogDrainDestination } from 'components/interfaces/LogDrains/CreateLogDrainDestination'
import { useRouter } from 'next/router'
import { useParams } from 'common'
import { Button } from 'ui'
import { useState } from 'react'
import { LogDrainSource } from 'components/interfaces/LogDrains/LogDrains.constants'

const LogDrainsSettings: NextPageWithLayout = () => {
  const [open, setOpen] = useState(false)
  const [newDrainSource, setNewDrainSource] = useState<LogDrainSource>('webhook')

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
            <Button onClick={() => setOpen(true)} type="primary">
              Add destination
            </Button>
          </div>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer className="flex flex-col gap-10" bottomPadding>
        <CreateLogDrainDestination
          open={open}
          onOpenChange={setOpen}
          defaultSource={newDrainSource}
        />
        <LogDrains
          onNewDrainClick={(src) => {
            setNewDrainSource(src)
            setOpen(true)
          }}
        />
      </ScaffoldContainer>
    </>
  )
}

LogDrainsSettings.getLayout = (page) => <SettingsLayout title="Log Drains">{page}</SettingsLayout>
export default LogDrainsSettings
