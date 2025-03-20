import { useCallback, useEffect, useState } from 'react'
import useLw14ConfData from './use-conf-data'
import supabase from '~/lib/supabase'
import { REALTIME_CHANNEL_STATES, REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js'

const LW14_TOPIC = 'lw14'
const GAUGES_UPDATES_EVENT = 'gauges-update'

export const usePartymode = () => {
  const [state, dispatch] = useLw14ConfData()
  const [shouldInitialize, setShouldInitialize] = useState(
    state.partymodeStatus === 'on' && !state.realtimeGaugesChannel
  )

  const createChannelAndSubscribe = useCallback(() => {
    const channel = supabase.channel(LW14_TOPIC, {
      config: {
        broadcast: {
          self: true,
          ack: true,
        },
      },
    })

    const userStatus = {}

    channel
      .on('broadcast', { event: GAUGES_UPDATES_EVENT }, (payload) => {
        console.log('Channel update', payload)
      })
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        const uniqueUsers = new Set([
          ...Object.entries(newState).map(([_, value]) => value[0].presence_ref),
        ])

        console.log('Presence sync', uniqueUsers.size, channel.presenceState())

        dispatch({
          type: 'GAUGES_DATA_FETCHED',
          payload: { peopleOnline: uniqueUsers.size },
        })
      })
      .subscribe(async (status, error) => {
        console.log('Channel status', status, error)
        await channel.track(userStatus)

        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          dispatch({ type: 'PARTYMODE_ENABLE', payload: channel })
        }
      })
  }, [dispatch])

  const toggle = useCallback(async () => {
    if (state.realtimeGaugesChannel?.state === REALTIME_CHANNEL_STATES.joined) {
      await state.realtimeGaugesChannel.unsubscribe()
      dispatch({ type: 'PARTYMODE_DISABLE' })
      return
    }

    if (
      state.realtimeGaugesChannel === null ||
      state.realtimeGaugesChannel.state === REALTIME_CHANNEL_STATES.closed
    ) {
      createChannelAndSubscribe()
    }
  }, [createChannelAndSubscribe, dispatch, state.realtimeGaugesChannel])

  useEffect(() => {
    if (shouldInitialize) {
      setShouldInitialize(false)
      createChannelAndSubscribe()
    }
  }, [createChannelAndSubscribe, shouldInitialize])

  return {
    toggle,
  }
}
