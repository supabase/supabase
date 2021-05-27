import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_KEY
)

/**
 * @param {number} channelId the currently selected Channel
 */
export const useStore = (props) => {
  const [channels, setChannels] = useState([])
  const [messages, setMessages] = useState([])
  const [users] = useState(new Map())
  const [newMessage, handleNewMessage] = useState(null)
  const [newChannel, handleNewChannel] = useState(null)
  const [newOrUpdatedUser, handleNewOrUpdatedUser] = useState(null)
  const [deletedChannel, handleDeletedChannel] = useState(null)
  const [deletedMessage, handleDeletedMessage] = useState(null)

  // Load initial data and set up listeners
  useEffect(() => {
    // Get Channels
    fetchChannels(setChannels)
    // Listen for new and deleted messages
    const messageListener = supabase
      .from('messages')
      .on('INSERT', (payload) => handleNewMessage(payload.new))
      .on('DELETE', (payload) => handleDeletedMessage(payload.old))
      .subscribe()
    // Listen for changes to our users
    const userListener = supabase
      .from('users')
      .on('*', (payload) => handleNewOrUpdatedUser(payload.new))
      .subscribe()
    // Listen for new and deleted channels
    const channelListener = supabase
      .from('channels')
      .on('INSERT', (payload) => handleNewChannel(payload.new))
      .on('DELETE', (payload) => handleDeletedChannel(payload.old))
      .subscribe()
    // Cleanup on unmount
    return () => {
      messageListener.unsubscribe()
      userListener.unsubscribe()
      channelListener.unsubscribe()
    }
  }, [])

  // Update when the route changes
  useEffect(() => {
    if (props?.channelId > 0) {
      fetchMessages(props.channelId, (messages) => {
        messages.forEach((x) => users.set(x.user_id, x.author))
        setMessages(messages)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.channelId])

  // New message recieved from Postgres
  useEffect(() => {
    if (newMessage && newMessage.channel_id === Number(props.channelId)) {
      const handleAsync = async () => {
        let authorId = newMessage.user_id
        if (!users.get(authorId)) await fetchUser(authorId, (user) => handleNewOrUpdatedUser(user))
        setMessages(messages.concat(newMessage))
      }
      handleAsync()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newMessage])

  // Deleted message received from postgres
  useEffect(() => {
    if (deletedMessage) setMessages(messages.filter((message) => message.id !== deletedMessage.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletedMessage])

  // New channel recieved from Postgres
  useEffect(() => {
    if (newChannel) setChannels(channels.concat(newChannel))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newChannel])

  // Deleted channel received from postgres
  useEffect(() => {
    if (deletedChannel) setChannels(channels.filter((channel) => channel.id !== deletedChannel.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletedChannel])

  // New or updated user recieved from Postgres
  useEffect(() => {
    if (newOrUpdatedUser) users.set(newOrUpdatedUser.id, newOrUpdatedUser)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newOrUpdatedUser])

  return {
    // We can export computed values here to map the authors to each message
    messages: messages.map((x) => ({ ...x, author: users.get(x.user_id) })),
    channels: channels !== null ? channels.sort((a, b) => a.slug.localeCompare(b.slug)) : [],
    users,
  }
}

/**
 * Fetch all channels
 * @param {function} setState Optionally pass in a hook or callback to set the state
 */
export const fetchChannels = async (setState) => {
  try {
    let { body } = await supabase.from('channels').select('*')
    if (setState) setState(body)
    return body
  } catch (error) {
    console.log('error', error)
  }
}

/**
 * Fetch a single user
 * @param {number} userId
 * @param {function} setState Optionally pass in a hook or callback to set the state
 */
export const fetchUser = async (userId, setState) => {
  try {
    let { body } = await supabase.from('users').select(`*`).eq('id', userId)
    let user = body[0]
    if (setState) setState(user)
    return user
  } catch (error) {
    console.log('error', error)
  }
}

/**
 * Fetch all roles for the current user
 * @param {function} setState Optionally pass in a hook or callback to set the state
 */
export const fetchUserRoles = async (setState) => {
  try {
    let { body } = await supabase.from('user_roles').select(`*`)
    if (setState) setState(body)
    return body
  } catch (error) {
    console.log('error', error)
  }
}

/**
 * Fetch all messages and their authors
 * @param {number} channelId
 * @param {function} setState Optionally pass in a hook or callback to set the state
 */
export const fetchMessages = async (channelId, setState) => {
  try {
    let { body } = await supabase
      .from('messages')
      .select(`*, author:user_id(*)`)
      .eq('channel_id', channelId)
      .order('inserted_at', true)
    if (setState) setState(body)
    return body
  } catch (error) {
    console.log('error', error)
  }
}

/**
 * Insert a new channel into the DB
 * @param {string} slug The channel name
 * @param {number} user_id The channel creator
 */
export const addChannel = async (slug, user_id) => {
  try {
    let { body } = await supabase.from('channels').insert([{ slug, created_by: user_id }])
    return body
  } catch (error) {
    console.log('error', error)
  }
}

/**
 * Insert a new message into the DB
 * @param {string} message The message text
 * @param {number} channel_id
 * @param {number} user_id The author
 */
export const addMessage = async (message, channel_id, user_id) => {
  try {
    let { body } = await supabase.from('messages').insert([{ message, channel_id, user_id }])
    return body
  } catch (error) {
    console.log('error', error)
  }
}

/**
 * Delete a channel from the DB
 * @param {number} channel_id
 */
export const deleteChannel = async (channel_id) => {
  try {
    let { body } = await supabase.from('channels').delete().match({ id: channel_id })
    return body
  } catch (error) {
    console.log('error', error)
  }
}

/**
 * Delete a message from the DB
 * @param {number} message_id
 */
export const deleteMessage = async (message_id) => {
  try {
    let { body } = await supabase.from('messages').delete().match({ id: message_id })
    return body
  } catch (error) {
    console.log('error', error)
  }
}
