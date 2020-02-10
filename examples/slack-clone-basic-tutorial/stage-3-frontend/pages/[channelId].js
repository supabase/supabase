import Link from 'next/link'
import { useRouter } from 'next/router'
import { useStore } from '../lib/Store'

const ChannelsPage = props => {
  const router = useRouter()
  const { channelId } = router.query
  const { messages, channels } = useStore({ channelId })

  return (
    <>
      <nav>
        <div>
          <button>New Channel</button>
        </div>
        <div>
          <h3>Channels</h3>
        </div>
        <ul>
          {channels.map(channel => (
            <li>
              <Link href="/[channelId]" as={`/${channel.id}`}>
                <a style={{ fontWeight: channel.id == channelId ? 'bold' : 'normal' }}>
                  {channel.slug}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <main>
        {messages.map(message => (
          <div>
            <p>
              <strong>{message.author.username}</strong>
            </p>
            <p>{message.message}</p>
          </div>
        ))}
      </main>
    </>
  )
}

export default ChannelsPage
