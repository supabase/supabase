import '~/styles/style.scss'
import Link from 'next/link'

export default props => (
  <main className="main">
    <div className="flex mb-4">
      {/* Sidebar */}
      <nav className="w-1/4 bg-gray-900 text-gray-100">
        <div className="p-2">
          <h4 className="font-bold">Channels</h4>
          <ul className="channel-list">
            {props.channels.map(x => (
              <SidebarItem channel={x} key={x.id} />
            ))}
          </ul>
        </div>
      </nav>

      {/* Messages */}
      <div className="w-3/4 bg-gray-800">{props.children}</div>
    </div>
  </main>
)

const SidebarItem = ({ channel }) => (
  <>
    <li>
      <Link href="/channels/[id]" as={`/channels/${channel.id}`}>
        <a>{channel.slug}</a>
      </Link>
    </li>
  </>
)
