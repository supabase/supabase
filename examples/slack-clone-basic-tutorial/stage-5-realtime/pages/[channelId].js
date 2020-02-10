import '../styles/style.scss'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useStore } from '../lib/Store'

const ChannelsPage = props => {
  const router = useRouter()
  const { channelId } = router.query
  const { messages, channels } = useStore({ channelId })

  return (
    <div className="main flex h-screen w-screen absolute">
      <nav className="w-1/4 bg-gray-900 text-gray-100 h-screen p-2">
        <button className="bg-blue-900 hover:bg-blue-700 text-white font-bold p-2 rounded w-full">
          New Channel
        </button>
        <h3 className="py-4">Channels</h3>
        <ul>
          {channels.map(channel => (
            <li key={channel.id}>
              <Link href="/[channelId]" as={`/${channel.id}`}>
                <a
                  className="hover:text-blue-400"
                  style={{ fontWeight: channel.id == channelId ? 'bold' : 'normal' }}
                >
                  {channel.slug}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <main className="w-3/4 bg-gray-800 h-screen p-2">
        {messages.map(message => (
          <div>
            <p className="text-blue-700 font-bold">{message.author.username}</p>
            <p className="text-white">{message.message}</p>
          </div>
        ))}
      </main>
    </div>
  )
}

export default ChannelsPage
