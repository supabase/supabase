import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { sortBy, take } from 'lodash'

import { LogData } from 'components/interfaces/Settings/Logs'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { uuidv4 } from 'lib/helpers'
import { EMPTY_ARR } from 'lib/void'
import { useCallback, useEffect, useReducer, useState } from 'react'

function reducer(
  state: LogData[],
  action: { type: 'add'; payload: { eventType: string; metadata: any } } | { type: 'clear' }
) {
  if (action.type === 'clear') {
    return EMPTY_ARR
  }

  const newState = take(
    sortBy(
      [
        {
          id: uuidv4(),
          timestamp: new Date().getTime(),
          event_message: action.payload.eventType,
          metadata: action.payload.metadata,
        } as LogData,
        ...state,
      ],
      (l) => -l.timestamp
    ),
    100
  )

  return newState
}

export interface RealtimeConfig {
  enabled: boolean
  channelName: string
  projectRef: string
  logLevel: string
  token: string
  schema: string
  table: string
  filter: string | undefined
  bearer: string | null
  enableBroadcast: boolean
  enablePresence: boolean
  enableDbChanges: boolean
}

export const useRealtimeEvents = ({
  enabled,
  channelName,
  projectRef,
  logLevel,
  token,
  schema,
  table,
  filter,
  bearer,
  enablePresence,
  enableDbChanges,
  enableBroadcast,
}: RealtimeConfig) => {
  // the default host is prod until the correct one comes through an API call.
  const [host, setHost] = useState(`https://${projectRef}.supabase.co`)
  useProjectApiQuery(
    { projectRef: projectRef },
    {
      onSuccess: (data) => {
        setHost(`${data.autoApiService.protocol}://${data.autoApiService.endpoint}`)
      },
    }
  )

  const [logData, dispatch] = useReducer(reducer, [] as LogData[])
  const pushEvent = (eventType: string, metadata: any) => {
    dispatch({ type: 'add', payload: { eventType, metadata } })
  }

  // Instantiate our client with the Realtime server and params to connect with
  let [client, setClient] = useState<SupabaseClient<any, 'public', any> | undefined>()
  let [channel, setChannel] = useState<RealtimeChannel | undefined>()

  useEffect(() => {
    if (!enabled) {
      return
    }
    const opts = {
      realtime: {
        params: {
          log_level: logLevel,
        },
      },
    }
    const newClient = createClient(host, token, opts)
    if (bearer != '') {
      newClient.realtime.setAuth(bearer)
    }

    setClient(newClient)
    return () => {
      client?.realtime.disconnect()
      setClient(undefined)
    }
  }, [enabled, bearer, host, logLevel, token])

  useEffect(() => {
    if (!client) {
      return
    }
    dispatch({ type: 'clear' })
    const newChannel = client?.channel(channelName, {
      config: { broadcast: { self: true } },
    })
    // Hack to confirm Postgres is subscribed
    // Need to add 'extension' key in the 'payload'
    newChannel.on('system' as any, {} as any, (payload: any) => {
      // if (payload.extension === 'postgres_changes' && payload.status === 'ok') {
      //   pushEventTo('#conn_info', 'postgres_subscribed', {})
      // }
      pushEvent('SYSTEM', payload)
    })

    if (enableBroadcast) {
      // Listen for all (`*`) `broadcast` events
      // The event name can by anything
      // Match on specific event names to filter for only those types of events and do something with them
      newChannel.on('broadcast', { event: '*' }, (payload) => pushEvent('BROADCAST', payload))
    }

    // Listen for all (`*`) `presence` events
    if (enablePresence) {
      newChannel.on('presence' as any, { event: '*' }, (payload) => {
        pushEvent('PRESENCE', payload)
      })
    }

    // Listen for all (`*`) `postgres_changes` events on tables in the `public` schema
    if (enableDbChanges) {
      let postgres_changes_opts: any = {
        event: '*',
        schema: schema,
        table: table,
        filter: undefined,
      }
      if (filter !== '') {
        postgres_changes_opts.filter = filter
      }
      newChannel.on('postgres_changes' as any, postgres_changes_opts, (payload: any) => {
        let ts = performance.now() + performance.timeOrigin
        let payload_ts = Date.parse(payload.commit_timestamp)
        let latency = ts - payload_ts
        pushEvent('POSTGRES', { ...payload, latency })
      })
    }

    // Finally, subscribe to the Channel we just setup
    newChannel.subscribe(async (status, error) => {
      if (status === 'SUBSCRIBED') {
        // Let LiveView know we connected so we can update the button text
        // pushEventTo('#conn_info', 'broadcast_subscribed', { host: host })

        if (enablePresence) {
          const name = 'user_name_' + Math.floor(Math.random() * 100)
          newChannel.send({
            type: 'presence',
            event: 'TRACK',
            payload: { name: name, t: performance.now() },
          })
        }
      } else if (status === 'CLOSED') {
        // console.log(`Realtime Channel status: ${status}`)
      } else {
        // console.error(`Realtime Channel error status: ${status}`)
        // console.error(`Realtime Channel error: ${error}`)
      }
    })

    setChannel(newChannel)
    return () => {
      newChannel.unsubscribe()
      setChannel(undefined)
    }
  }, [
    client,
    channelName,
    enableBroadcast,
    enableDbChanges,
    enablePresence,
    filter,
    host,
    schema,
    table,
  ])

  const sendEvent = useCallback(
    (event: string, payload: any) => {
      channel?.send({
        type: 'broadcast',
        event,
        payload,
      })
    },
    [channel]
  )
  return { logData, sendEvent }
}
