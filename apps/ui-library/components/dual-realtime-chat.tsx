import { BlockPreview } from './block-preview'

export function DualRealtimeChat() {
  const roomName = `room-${Math.floor(Math.random() * 1000)}`

  return (
    <div className="flex flex-row -space-x-px w-full">
      <BlockPreview name={`realtime-chat-demo?roomName=${roomName}`} isPair />
      <BlockPreview name={`realtime-chat-demo?roomName=${roomName}`} isPair />
    </div>
  )
}
