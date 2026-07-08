import { useParams } from 'common'
import { useCallback, useEffect, useState } from 'react'

import { EmptyRealtime } from './EmptyRealtime'
import { Header } from './Header'
import MessagesTable from './MessagesTable'
import { SendMessageModal } from './SendMessageModal'
import { useRealtimeInspectorShortcuts } from './useRealtimeInspectorShortcuts'
import { RealtimeConfig, useRealtimeMessages } from './useRealtimeMessages'
import { useDatabasePublicationsQuery } from '@/data/database-publications/database-publications-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTrack } from '@/lib/telemetry/track'

/**
 * Acts as a container component for the entire log display
 */
export const RealtimeInspector = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  // Check if realtime publications are available
  const { data: publications } = useDatabasePublicationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const realtimePublication = (publications ?? []).find(
    (publication) => publication.name === 'supabase_realtime'
  )
  const isRealtimeAvailable =
    !!realtimePublication &&
    ((realtimePublication?.tables ?? []).length > 0 || realtimePublication?.tables === null)

  const [sendMessageShown, setSendMessageShown] = useState(false)
  const [channelPopoverOpen, setChannelPopoverOpen] = useState(false)
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false)
  const [realtimeConfig, setRealtimeConfig] = useState<RealtimeConfig>({
    enabled: false,
    projectRef: ref!,
    channelName: '',
    logLevel: 'info',
    token: '', // will be filled out by RealtimeTokensPopover
    schema: 'public',
    table: '*',
    isChannelPrivate: false,
    filter: undefined,
    bearer: null,
    enablePresence: true,
    enableDbChanges: isRealtimeAvailable, // Initialize based on publications availability
    enableBroadcast: true,
  })

  const track = useTrack()
  const { logData, sendMessage } = useRealtimeMessages(realtimeConfig, setRealtimeConfig)

  const hasChannel = realtimeConfig.channelName.length > 0
  const isListening = realtimeConfig.enabled

  const handleJoinChannel = useCallback(() => {
    if (!hasChannel) {
      setChannelPopoverOpen(true)
    }
  }, [hasChannel])

  const handleToggleFilters = useCallback(() => {
    if (hasChannel) {
      setFilterPopoverOpen(true)
    }
  }, [hasChannel])

  const handleBroadcast = useCallback(() => {
    if (isListening) {
      setSendMessageShown(true)
    }
  }, [isListening])

  useRealtimeInspectorShortcuts({
    hasChannel,
    isListening,
    onJoinChannel: handleJoinChannel,
    onToggleFilters: handleToggleFilters,
    onBroadcast: handleBroadcast,
  })

  // Update enableDbChanges when publications change
  useEffect(() => {
    setRealtimeConfig((prev) => ({ ...prev, enableDbChanges: isRealtimeAvailable }))
  }, [isRealtimeAvailable])

  return (
    <div className="flex flex-col grow h-full">
      <Header
        config={realtimeConfig}
        onChangeConfig={setRealtimeConfig}
        channelPopoverOpen={channelPopoverOpen}
        onChannelPopoverChange={setChannelPopoverOpen}
        filterPopoverOpen={filterPopoverOpen}
        onFilterPopoverChange={setFilterPopoverOpen}
      />
      <div className="relative flex flex-col grow">
        <div className="flex grow">
          {(logData ?? []).length > 0 ? (
            <MessagesTable
              hasChannelSet={hasChannel}
              enabled={isListening}
              data={logData}
              showSendMessage={() => setSendMessageShown(true)}
            />
          ) : (
            <EmptyRealtime projectRef={ref!} />
          )}
        </div>
      </div>
      <SendMessageModal
        visible={sendMessageShown}
        onSelectCancel={() => setSendMessageShown(false)}
        onSelectConfirm={(v) => {
          track('realtime_inspector_broadcast_sent')
          sendMessage(v.message, v.payload, () => setSendMessageShown(false))
        }}
      />
    </div>
  )
}
