/**
 * Fat controller!
 * Think of this page as a store that controls all the data flow.
 */
import Layout from '~/components/Layout'
import Message from '~/components/Message'
import MessageInput from '~/components/MessageInput'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/router'

/// TEMP
import { Socket } from '@supabase/realtime-js'
const REALTIME_URL = process.env.REALTIME_URL || 'ws://localhost:4000/socket'
var socket = new Socket(REALTIME_URL)
socket.connect()
const topic = socket.channel('realtime:*')
topic.on('*', msg => {
  console.log('msg', msg)
})
topic
  .join()
  .receive('ok', () => console.log('Connected'))
  .receive('error', () => console.log('Failed'))
  .receive('timeout', () => console.log('Waiting...'))
/// TEMP

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
// const mySubscription = supabase
//   .from('messages')
//   .on('*', payload => {
//     console.log('Change received!', payload)
//   })
//   .subscribe()
  
const ChannelsPage = props => {
  const router = useRouter()
  const { id: channelId } = router.query
  const [channels, setChannels] = useState([])
  const [messages, setMessages] = useState([])

  // Initial load of data
  useEffect(() => {
    try {
      setChannels(props.channels)
    } catch (error) {
      console.log('Error: ', error)
    }
  }, [])

  // Update when the route changes
  useEffect(() => {
    try {
      getMessages(channelId, setMessages)
    } catch (error) {
      console.log('Error: ', error)
    }
  }, [router.query.id])

  // Render the channels and messages
  return (
    <Layout channels={channels}>
      <div className="p-2">
        {messages.map(x => (
          <Message key={x.id} message={x} />
        ))}
      </div>
      <div className="p-2">
        <MessageInput onSubmit={text => addMessage(text, channelId, 2)} />
      </div>
    </Layout>
  )
}

/**
 * Hydrate the page on initial load
 */
ChannelsPage.getInitialProps = async () => {
  let channels = await getChannels()
  return { channels }
}

/**
 * Get all channels
 * @param {function} setState Optionally pass in a hook or callback to set the state
 */
const getChannels = async setState => {
  try {
    let { body } = await supabase.from('channels').select('*')
    if (setState) setState(body)
    return body
  } catch (error) {
    console.log('error', error)
  }
}

/**
 * Get all messages and their authors
 * @param {number} channelId
 * @param {function} setState Optionally pass in a hook or callback to set the state
 */
const getMessages = async (channelId, setState) => {
  try {
    let { body } = await supabase
      .from('messages')
      .eq('channel_id', channelId)
      .select(`*, author:user_id(*)`)
      .order('inserted_at', true)
    if (setState) setState(body)
    return body
  } catch (error) {
    console.log('error', error)
  }
}

/**
 * Insert a new message
 * @param {string} message The message text
 * @param {number} channel_id
 * @param {number} user_id The author
 */
const addMessage = async (message, channel_id, user_id) => {
  try {
    let { body } = await supabase.from('messages').insert([{ message, channel_id, user_id }])
    return body
  } catch (error) {
    console.log('error', error)
  }
}

export default ChannelsPage
