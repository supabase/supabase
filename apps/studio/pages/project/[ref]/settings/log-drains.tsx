import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import {
  ScaffoldActionsGroup,
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

const LogDrainsSettings: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()
  const open = router.query.new === '1'
  const linksBaseUrl = `/project/${ref}/settings/log-drains`

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
            <CreateLogDrainDestination
              open={open}
              onOpenChange={(v) => {
                v ? router.push(`${linksBaseUrl}?new=1`) : router.push(linksBaseUrl)
              }}
              defaultSource={router.query.src as any}
            />
          </div>
        </ScaffoldHeader>
      </ScaffoldContainer>
      <ScaffoldContainer className="flex flex-col gap-10" bottomPadding>
        <LogDrains />
      </ScaffoldContainer>
    </>
  )
}

LogDrainsSettings.getLayout = (page) => <SettingsLayout title="Log Drains">{page}</SettingsLayout>
export default LogDrainsSettings
