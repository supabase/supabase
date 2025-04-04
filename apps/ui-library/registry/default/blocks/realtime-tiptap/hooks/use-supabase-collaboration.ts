import { createSupabaseProvider } from './yjs-supabase-provider'
import { Collaboration } from '@tiptap/extension-collaboration'
import { useEffect, useMemo, useState } from 'react'

export function useSupabaseCollaboration({ channel }: { channel: string }) {
  const [isConnected, setIsConnected] = useState(false)
  const provider = useMemo(() => createSupabaseProvider(channel), [channel])

  useEffect(() => {
    console.log('Collaboration provider initialized', {
      channel: provider.channel,
      isConnected: provider.isConnected(),
    })

    // Set up a connection status check
    const checkConnection = setInterval(() => {
      const connected = provider.isConnected()
      if (connected !== isConnected) {
        console.log('Connection status changed:', connected)
        setIsConnected(connected)
      }
    }, 1000)

    return () => {
      console.log('Cleaning up collaboration provider')
      clearInterval(checkConnection)
      provider.cleanup()
    }
  }, [provider, isConnected])

  const SupabaseCollaboration = useMemo(
    () =>
      Collaboration.configure({
        document: provider.yDoc,
      }),
    [provider.yDoc]
  )

  return {
    SupabaseCollaboration,
    yDoc: provider.yDoc,
    supabaseChannel: provider.channel,
    isConnected,
  }
}
