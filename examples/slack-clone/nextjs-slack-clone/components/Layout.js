import Link from 'next/link'
import { useContext } from 'react'
import UserContext from '~/lib/UserContext'
import { supabase, addChannel, deleteChannel } from '~/lib/Store'
import TrashIcon from '~/components/TrashIcon'

export default function Layout(props) {
  const { signOut, user, userRoles } = useContext(UserContext)

  const slugify = (text) => {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w-]+/g, '') // Remove all non-word chars
      .replace(/--+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, '') // Trim - from end of text
  }

  const newChannel = async () => {
    const slug = prompt('Please enter the name of the channel')
    if (slug) {
      const providerId = user?.app_metadata?.provider.startsWith('sso')
        ? user?.app_metadata?.provider
        : 'public'
      addChannel(slugify(slug), user.id, providerId)
    }
  }

  return (
    <main className="main flex h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <nav
        className="w-64 bg-gray-900 text-gray-100"
        style={{ maxWidth: '20%', minWidth: 150, maxHeight: '100vh' }}
      >
        <div className="p-2">
          <div className="p-2">
            <button
              className="bg-blue-900 hover:bg-blue-800 text-white py-2 px-4 rounded w-full transition duration-150"
              onClick={() => newChannel()}
            >
              New Channel
            </button>
          </div>
          <hr className="my-2" />
          <div className="p-2">
            <h6 className="text-xs">{user?.email}</h6>
            <h6 className="text-xs">{user?.user_metadata?.custom_claims?.organization ?? '-'}</h6>
            <button
              className="bg-blue-900 hover:bg-blue-800 text-white mt-2 py-2 px-4 rounded w-full transition duration-150"
              onClick={() => signOut()}
            >
              Log out
            </button>
          </div>
          <hr className="my-2" />
          <h4 className="font-bold">Channels</h4>
          <ul className="channel-list">
            {props.channels.map((channel) =>
              channel.provider_id === 'public' ? (
                <SidebarItem
                  channel={channel}
                  key={channel.id}
                  isActiveChannel={channel.id === props.activeChannelId}
                  user={user}
                  userRoles={userRoles}
                />
              ) : null
            )}
          </ul>
          {props.channels.some((channel) => channel.provider_id !== 'public') ? (
            <>
              <hr className="my-2" />
              <h4 className="font-bold">
                {user?.user_metadata?.custom_claims?.organization ?? 'Private'}
              </h4>
            </>
          ) : null}
          <ul className="channel-list">
            {props.channels.map((channel) =>
              channel.provider_id !== 'public' ? (
                <SidebarItem
                  channel={channel}
                  key={channel.id}
                  isActiveChannel={channel.id === props.activeChannelId}
                  user={user}
                  userRoles={userRoles}
                />
              ) : null
            )}
          </ul>
        </div>
      </nav>

      {/* Messages */}
      <div className="flex-1 bg-gray-800 h-screen">{props.children}</div>
    </main>
  )
}

const SidebarItem = ({ channel, isActiveChannel, user, userRoles }) => (
  <>
    <li className="flex items-center justify-between">
      <Link href="/channels/[id]" as={`/channels/${channel.id}`}>
        <a className={isActiveChannel ? 'font-bold' : ''}>{channel.slug}</a>
      </Link>
      {channel.id !== 1 && (channel.created_by === user?.id || userRoles.includes('admin')) && (
        <button onClick={() => deleteChannel(channel.id)}>
          <TrashIcon />
        </button>
      )}
    </li>
  </>
)
