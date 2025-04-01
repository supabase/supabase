import Demo from '@/registry/default/examples/realtime-chat-demo'

const RealtimeChatDemoPage = ({ searchParams }: { searchParams: { roomName: string } }) => {
  const roomName = searchParams['roomName'] || `room-${Math.floor(Math.random() * 1000)}`

  return <Demo roomName={roomName} />
}

export default RealtimeChatDemoPage
