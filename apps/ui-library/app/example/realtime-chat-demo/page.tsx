import Demo from '@/registry/default/examples/realtime-chat-demo'

const RealtimeChatDemoPage = async (props: { searchParams: Promise<{ roomName: string }> }) => {
  const searchParams = await props.searchParams
  const roomName = searchParams['roomName'] || `room-${Math.floor(Math.random() * 1000)}`

  return <Demo roomName={roomName} />
}

export default RealtimeChatDemoPage
