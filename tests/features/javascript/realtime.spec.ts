import { params, suite, test, timeout } from '@testdeck/jest'
import { faker } from '@faker-js/faker'
import { Severity } from 'allure-js-commons'

import { RealtimeChannel } from '@supabase/supabase-js'

import { FEATURE } from '../templates/enums'
import { description, feature, log, severity, step } from '../../.jest/jest-custom-reporter'
import { Hooks } from './hooks'

@suite('realtime')
@timeout(30000)
class Realtime extends Hooks {
  @feature(FEATURE.REALTIME)
  @severity(Severity.BLOCKER)
  @description('When you call "on" table then connected realtime client should be returned')
  @test
  async '[skip-local] realtime connect'() {
    let catchError: Error = undefined
    const { supabase } = await this.createSignedInSupaClient()

    const subscription = {
      type: 'postgres_changes',
      filter: { event: '*', schema: 'public' },
    }
    const channel = supabase
      .channel('profiles')
      .on(subscription.type, subscription.filter, (payload: any) => console.log(payload))
    channel.onError((error: any) => {
      catchError = error
    })
    channel.subscribe()

    expect(channel).toBeDefined()
    const err = await this.waitForChannelJoined(channel)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    expect(catchError).toBeUndefined()
    expect(err).toBeNull()
    const ok = await supabase.removeChannel(channel)
    expect(ok).toBe('ok')
  }

  @feature(FEATURE.REALTIME)
  @severity(Severity.BLOCKER)
  @description('When you subscrive to realtime, you have to receive updates')
  @timeout(60000)
  @test
  async '[skip-local] realtime receive event'() {
    let catchError: Error = undefined
    let res: any
    let t: NodeJS.Timeout
    const { supabase, user } = await this.createSignedInSupaClient()

    const subscription = {
      type: 'postgres_changes',
      filter: { event: '*', schema: 'public' },
    }
    let payloadReceived = (payload: any) => {
      clearTimeout(t)
      expect(payload.eventType).toBe('INSERT')
      expect(payload.schema).toBe('public')
      expect(payload.table).toBe('profiles')
      expect(payload.new.id).toBe(user.id)
      expect(payload.new.username).toBe(user.username)
      expect(payload.old).toEqual({})
      expect(payload.error).toBeUndefined()
      res(null)
    }

    const channel = supabase
      .channel('profiles')
      .on(subscription.type, subscription.filter, payloadReceived)
    channel.onError((error: any) => {
      catchError = error
    })
    channel.subscribe()

    expect(channel).toBeDefined()
    await this.waitForChannelJoined(channel)
    expect(catchError).toBeUndefined()
    // we should wait around 6 seconds to connect to database changes
    await new Promise((resolve) => setTimeout(resolve, 10000))

    const eventPromise = new Promise((resolve, reject) => {
      res = resolve
      new Promise(() => {
        t = setTimeout(() => reject(new Error('timeout')), 30000)
      })
    })
    await this.insertProfile(supabase, user, user)
    expect(eventPromise).resolves.toBeNull()

    const ok = await supabase.removeChannel(channel)
    expect(ok).toBe('ok')
  }

  @feature(FEATURE.REALTIME)
  @severity(Severity.NORMAL)
  @description('When you call "on" table but not subscribe then no events have to be returned')
  @test
  async '[skip-local] no event updates until subscribe'() {
    let catchError: Error = undefined
    const { supabase, user } = await this.createSignedInSupaClient()

    const subscription = {
      type: 'postgres_changes',
      filter: { event: '*', schema: 'public' },
    }
    const channel = supabase
      .channel('profiles')
      .on(subscription.type, subscription.filter, (payload: any) => {
        console.log(payload)
        expect('event received').toBe('should not receive event')
      })
    channel.onError((error: any) => {
      catchError = error
    })

    expect(channel).toBeDefined()
    await this.insertProfile(supabase, user, user)

    // wait for 1 second to see if we receive any events
    await new Promise((resolve) => setTimeout(resolve, 1000))
    expect(channel.isClosed).toBeTruthy()
    expect(catchError).toBeUndefined()
    const ok = await supabase.removeChannel(channel)
    expect(ok).toBe('ok')
  }

  @feature(FEATURE.REALTIME)
  @severity(Severity.BLOCKER)
  @description(
    'When you create 2 subs (1 subscribed and 1 not yet) then both should be returned on get subs'
  )
  @test
  async 'get subscriptions'() {
    const { supabase, user } = await this.createSignedInSupaClient()

    const subscription = {
      type: 'postgres_changes',
      filter: { event: '*', schema: 'public' },
    }
    const channel1 = supabase
      .channel('profiles')
      .on(subscription.type, subscription.filter, (payload: any) => {
        console.log(payload)
        expect('event received').toBe('should not receive event')
      })
    const channel2 = supabase
      .channel('profiles')
      .on(subscription.type, subscription.filter, (payload: any) => {
        console.log(payload)
        expect('event received').toBe('should not receive event')
      })

    const channels = supabase.getChannels()
    expect(channels).toEqual(expect.arrayContaining([channel1, channel2]))
    supabase.removeAllChannels()
    expect(supabase.getChannels().length).toEqual(0)
  }

  @feature(FEATURE.REALTIME)
  @severity(Severity.NORMAL)
  @description('When you subscribe on table then corresponding events have to be returned')
  @params.skip({ event: 'INSERT', returnedTypes: ['insert'] })
  @params.skip({ event: 'UPDATE', returnedTypes: ['update'] })
  @params.skip({ event: 'DELETE', returnedTypes: ['delete'] })
  @params.skip({ event: '*', returnedTypes: ['insert', 'update', 'delete'] })
  async 'subscribe on table'() {
    // todo
  }

  @feature(FEATURE.REALTIME)
  @severity(Severity.NORMAL)
  @description(
    'When you create multiple subscriptions then corresponding events have to be returned'
  )
  @params.skip({
    events: [
      { event: 'INSERT', table: 'rt_table1' },
      { event: '*', table: 'rt_table1' },
    ],
    returnedIds: [[], []],
  })
  @params.skip({
    events: [
      { event: 'UPDATE', table: 'rt_table1' },
      { event: 'DELETE', table: 'rt_table1' },
    ],
    returnedIds: [[], []],
  })
  @params.skip({
    events: [
      { event: 'INSERT', table: 'rt_table1' },
      { event: 'INSERT', table: 'rt_table2' },
    ],
    returnedIds: [[], []],
  })
  async 'multiple subscriptions'() {
    // todo
  }

  @feature(FEATURE.REALTIME)
  @severity(Severity.NORMAL)
  @description('When you subscribe on table with RLS then corresponding events have to be returned')
  @params.skip({ event: 'INSERT', returnedTypes: ['insert'] })
  @params.skip({ event: 'UPDATE', returnedTypes: ['update'] })
  @params.skip({ event: 'DELETE', returnedTypes: ['delete'] })
  @params.skip({ event: '*', returnedTypes: ['insert', 'update', 'delete'] })
  async 'subscribe on table with RLS'() {
    // todo
  }

  @feature(FEATURE.REALTIME)
  @severity(Severity.CRITICAL)
  @description('When you subscribe on table with RLS then only allowed events have to be returned')
  @params.skip({ event: 'INSERT', returnedIds: [] })
  @params.skip({ event: 'UPDATE', returnedIds: [] })
  @params.skip({ event: 'DELETE', returnedIds: [] })
  @params.skip({ event: '*', returnedIds: [] })
  async 'subscribe on table with RLS policies'() {
    // todo
  }

  @feature(FEATURE.REALTIME)
  @severity(Severity.CRITICAL)
  @description(
    'When you subscribe on table with 2 clients then they have to receive different events'
  )
  @test.skip
  async 'subscribe from 2 clients'() {
    // todo
  }

  @feature(FEATURE.REALTIME)
  @severity(Severity.NORMAL)
  @description(
    'When you subscribe on table with RLS policies then service key subscription has to bypass RLS'
  )
  @params.skip({ event: 'INSERT', returnedTypes: ['insert'] })
  @params.skip({ event: 'UPDATE', returnedTypes: ['update'] })
  @params.skip({ event: 'DELETE', returnedTypes: ['delete'] })
  @params.skip({ event: '*', returnedTypes: ['insert', 'update', 'delete'] })
  async 'subscribe on RLS table with service key'() {
    // todo
  }

  @feature(FEATURE.REALTIME)
  @severity(Severity.CRITICAL)
  @description('When you unsubscribe from table then no events have to be returned')
  @test
  async '[skip-local] unsubscribe from table'() {
    let catchError: Error = undefined
    const { supabase, user } = await this.createSignedInSupaClient()

    const subscription = {
      type: 'postgres_changes',
      filter: { event: '*', schema: 'public' },
    }
    const channel = supabase
      .channel('profiles')
      .on(subscription.type, subscription.filter, (payload: any) => {
        console.log(payload)
        expect('event received').toBe('should not receive event')
      })
    channel.onError((error: any) => {
      catchError = error
    })
    channel.subscribe()
    // wait for subscription to postgres
    await new Promise((resolve) => setTimeout(resolve, 8000))
    const ok = await channel.unsubscribe()
    expect(ok).toEqual('ok')

    await this.insertProfile(supabase, user, user)

    // wait for 1 second to see if we receive any events
    await new Promise((resolve) => setTimeout(resolve, 1000))
    expect(channel.isClosed).toBeTruthy()
    expect(catchError).toBeUndefined()
    await supabase.removeChannel(channel)
  }

  @feature(FEATURE.REALTIME)
  @severity(Severity.CRITICAL)
  @description('When you remove one subscription then only events from another have to be returned')
  @test
  async '[skip-local] remove one subscription'() {
    let catchError: Error = undefined
    const { supabase, user } = await this.createSignedInSupaClient()

    const subscription = {
      type: 'postgres_changes',
      filter: { event: '*', schema: 'public' },
    }
    const channel = supabase
      .channel('profiles')
      .on(subscription.type, subscription.filter, (payload: any) => {
        console.log(payload)
        expect('event received').toBe('should not receive event')
      })
    channel.onError((error: any) => {
      catchError = error
    })
    channel.subscribe()
    // wait for subscription to postgres
    await new Promise((resolve) => setTimeout(resolve, 8000))
    const ok = await supabase.removeChannel(channel)
    expect(ok).toEqual('ok')

    await this.insertProfile(supabase, user, user)

    // wait for 1 second to see if we receive any events
    await new Promise((resolve) => setTimeout(resolve, 1000))
    expect(channel.isClosed).toBeTruthy()
    expect(catchError).toBeUndefined()
  }

  @feature(FEATURE.REALTIME)
  @severity(Severity.CRITICAL)
  @description('When you remove all subscription then no events have to be returned')
  @test
  async '[skip-local] remove all subscriptions'() {
    let catchError: Error = undefined
    const { supabase, user } = await this.createSignedInSupaClient()

    const subscription = {
      type: 'postgres_changes',
      filter: { event: '*', schema: 'public' },
    }
    const channel = supabase
      .channel('profiles')
      .on(subscription.type, subscription.filter, (payload: any) => {
        console.log(payload)
        expect('event received').toBe('should not receive event')
      })
    channel.onError((error: any) => {
      catchError = error
    })
    channel.subscribe()
    // wait for subscription to postgres
    await new Promise((resolve) => setTimeout(resolve, 8000))
    const ok = await supabase.removeAllChannels()
    expect(ok).toEqual(expect.arrayContaining(['ok']))

    await this.insertProfile(supabase, user, user)

    // wait for 1 second to see if we receive any events
    await new Promise((resolve) => setTimeout(resolve, 1000))
    expect(channel.isClosed).toBeTruthy()
    expect(catchError).toBeUndefined()
  }

  @step('Wait until channel is joined')
  async waitForChannelJoined(channel: RealtimeChannel): Promise<Error> {
    for (let i = 0; i < 30; i++) {
      if (channel.isJoined()) {
        return null
      }
      if (channel.isErrored()) {
        return new Error('Channel is errored')
      }
      if (channel.isLeaving()) {
        return new Error('Channel is leaving')
      }
      if (channel.isClosed()) {
        return new Error('Channel is closed')
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    return new Error("Channel didn't join in 3 seconds")
  }
}
