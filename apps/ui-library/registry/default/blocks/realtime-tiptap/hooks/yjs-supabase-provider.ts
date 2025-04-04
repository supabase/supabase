import * as Y from 'yjs'
import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/client'

export function createSupabaseProvider(channelName: string) {
  const supabase = createClient()
  const yDoc = new Y.Doc()
  const channel = supabase.channel(channelName)
  let isConnected = false

  // Local -> Remote
  const handleLocalUpdate = (update: Uint8Array, origin?: any) => {
    if (origin === 'supabase') return // Don't send updates that came from Supabase

    console.log('handleLocalUpdate')
    if (!isConnected) {
      console.warn('Not connected, cannot send update')
      return
    }

    try {
      // Broadcast update to other clients
      channel.send({
        type: 'broadcast',
        event: 'update',
        payload: { update: Array.from(update) },
      })
      console.log('Update sent successfully')
    } catch (error) {
      console.error('Error sending update:', error)
    }
  }

  // Remote -> Local
  const handleRemoteUpdate = (payload: { update: number[] }) => {
    console.log('handleRemoteUpdate')
    const update = new Uint8Array(payload.update)
    Y.applyUpdate(yDoc, update, 'supabase')
  }

  // Setup subscriptions
  yDoc.on('update', handleLocalUpdate)

  channel.on('broadcast', { event: 'update' }, ({ payload }) => {
    console.log('received update')
    handleRemoteUpdate(payload)
  })

  // Subscribe to the channel and wait for the subscription to be established
  channel.subscribe((status) => {
    console.log('Channel subscription status:', status)
    if (status === 'SUBSCRIBED') {
      isConnected = true
      console.log('Channel successfully subscribed')
    }
  })

  // Cleanup function
  const cleanup = () => {
    console.log('Cleaning up provider')
    yDoc.off('update', handleLocalUpdate)
    channel.unsubscribe()
    isConnected = false
  }

  return {
    yDoc,
    channel,
    isConnected: () => isConnected,
    cleanup,
  }
}
