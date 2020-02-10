import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

export const useStore = ({ channelId }) => {
  const [channels, setChannels] = useState(new Array())
  const [messages, setMessages] = useState(new Array())
  const [users] = useState(new Map())

  // Fetches messages for the channel and starts the channel listeners
  const reloadStore = () => {
    if (channelId) {
        console.log('channelId', channelId)
      fetchChannels(setChannels)
      fetchMessages(channelId, setMessages)
    }
  }

  // Update the store when the user changes the "channel"
  useEffect(reloadStore, [channelId])

  // Export computed properties to use in our app
  return {
    channels: channels.sort((a, b) => a.slug.localeCompare(b.slug)),
    messages,
    users,
  }
}

export const fetchChannels = async callback => {
  try {
    let { body } = await supabase.from('channels').select('*')
    if (callback) callback(body)
    return body
  } catch (error) {
    console.log('error', error)
  }
}

export const fetchMessages = async (channelId, callback) => {
  try {
    let { body } = await supabase
      .from('messages')
      .eq('channel_id', channelId)
      .select(`*, author:user_id(*)`)
      .order('id', true)
    if (callback) callback(body)
    return body
  } catch (error) {
    console.log('error', error)
  }
}
