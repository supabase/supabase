import { params, suite, test } from '@testdeck/jest'
import { faker } from '@faker-js/faker'
import { Severity } from 'allure-js-commons'

import { Session, SupabaseClient, User, UserAttributes } from '@supabase/supabase-js'

import { FEATURE } from '../templates/enums'
import { description, feature, log, severity, step } from '../../.jest/jest-custom-reporter'
import { Hooks } from './hooks'

@suite('realtime')
class Realtime extends Hooks {
  @feature(FEATURE.REALTIME)
  @severity(Severity.BLOCKER)
  @description('When you call "on" table then connected realtime client should be returned')
  @test.skip
  async 'realtime connect'() {
    // todo
  }

  @feature(FEATURE.REALTIME)
  @severity(Severity.NORMAL)
  @description('When you call "on" table but not subscribe then no events have to be returned')
  @test.skip
  async 'no event updates until subscribe'() {
    // todo
  }

  @feature(FEATURE.REALTIME)
  @severity(Severity.BLOCKER)
  @description(
    'When you create 2 subs (1 subscribed and 1 not yet) then both should be returned on get subs'
  )
  @test.skip
  async 'get subscriptions'() {
    // todo
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
  @test.skip
  async 'unsubscribe from table'() {
    // todo
  }

  @feature(FEATURE.REALTIME)
  @severity(Severity.CRITICAL)
  @description('When you remove one subscription then only events from another have to be returned')
  @test.skip
  async 'remove one subscription'() {
    // todo
  }

  @feature(FEATURE.REALTIME)
  @severity(Severity.CRITICAL)
  @description('When you remove all subscription then no events have to be returned')
  @test.skip
  async 'remove all subscriptions'() {
    // todo
  }
}
