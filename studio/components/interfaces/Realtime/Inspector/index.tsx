import { useState } from 'react'

import EventsTable from './EventsTable'
import { Header } from './Header'
import { RealtimeConfig, useRealtimeEvents } from './useRealtimeEvents'
import { useCheckPermissions } from 'hooks'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { DEFAULT_PROJECT_API_SERVICE_ID } from 'lib/constants'
import { useParams } from 'common'
import { useProjectApiQuery } from 'data/config/project-api-query'

/**
 * Acts as a container component for the entire log display
 */
export const RealtimeInspector = () => {
  const { ref } = useParams()

  const [realtimeConfig, setRealtimeConfig] = useState<RealtimeConfig>({
    enabled: false,
    projectRef: ref!,
    channelName: 'room_a',
    logLevel: 'info',
    token: '', // will be filled out by RealtimeTokensPopover
    schema: 'public',
    table: '*',
    tableId: undefined,
    filter: undefined,
    bearer: null,
    enablePresence: true,
    enableDbChanges: true,
    enableBroadcast: true,
  })

  const { logData, sendEvent } = useRealtimeEvents(realtimeConfig)

  return (
    <div className="flex flex-col flex-grow h-full">
      <Header config={realtimeConfig} onChangeConfig={setRealtimeConfig} />
      <div className="relative flex flex-col flex-grow h-full">
        <div className="flex h-full">
          <EventsTable enabled={realtimeConfig.enabled} data={logData} />
        </div>
      </div>
    </div>
  )
}
