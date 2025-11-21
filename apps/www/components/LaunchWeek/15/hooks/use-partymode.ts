import { useCallback, useEffect, useState } from 'react'
import useLw14ConfData from './use-conf-data'
import supabase from '../supabase'
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

    return channel
      .on('broadcast', { event: GAUGES_UPDATES_EVENT }, (data) => {
        const { payload } = data

        dispatch({
          type: 'GAUGES_DATA_FETCHED',
          payload: {
            payloadFill: payload.payload_fill,
            payloadSaturation: payload.payload_saturation,
            meetupsAmount: payload.meetups_amount,
          },
        })
      })
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        const uniqueUsers = new Set([
          ...Object.entries(newState).map(([_, value]) => value[0].presence_ref),
        ])

        dispatch({
          type: 'GAUGES_DATA_FETCHED',
          payload: { peopleOnline: uniqueUsers.size },
        })
      })
      .subscribe(async (status, error) => {
        // console.log('Channel status', status, error)
        await channel.track(userStatus)

        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          dispatch({ type: 'PARTYMODE_ENABLE', payload: channel })
        }
      })
  }, [dispatch])

  const toggle = useCallback(async () => {
    if (state.partymodeStatus === 'on') {
      await state.realtimeGaugesChannel?.unsubscribe()
      dispatch({ type: 'PARTYMODE_DISABLE' })
    } else {
      createChannelAndSubscribe()
    }
  }, [createChannelAndSubscribe, dispatch, state.partymodeStatus, state.realtimeGaugesChannel])

  const fetchGaugesData = useCallback(async () => {
    const [{ data: payloadData, error: payloadError }, { data: meetupsData, error: meetupsError }] =
      await Promise.all([
        supabase.rpc('get_payload_data_for_lw14'),
        supabase.rpc('get_meetups_data_for_lw14'),
      ])

    if (payloadError || meetupsError) {
      console.error('Error fetching gauges data', payloadError, meetupsError)
      return
    }

    dispatch({
      type: 'GAUGES_DATA_FETCHED',
      payload: {
        payloadFill: payloadData.payload_fill,
        payloadSaturation: payloadData.payload_saturation,
        meetupsAmount: meetupsData.meetups_amount,
      },
    })
  }, [dispatch])

  useEffect(() => {
    if (
      state.partymodeStatus === 'on' &&
      (!state.realtimeGaugesChannel ||
        state.realtimeGaugesChannel.state === REALTIME_CHANNEL_STATES.closed)
    ) {
      const channel = createChannelAndSubscribe()
      void fetchGaugesData()
      return () => {
        if (
          state.partymodeStatus === 'off' &&
          state.realtimeGaugesChannel?.state === REALTIME_CHANNEL_STATES.joined
        )
          channel.unsubscribe()
      }
    }
  }, [
    createChannelAndSubscribe,
    fetchGaugesData,
    shouldInitialize,
    state.partymodeStatus,
    state.realtimeGaugesChannel,
  ])

  return {
    toggle,
  }
}
