import { params, suite, test } from '@testdeck/jest'
import { faker } from '@faker-js/faker'
import { Severity } from 'allure-js-commons'

import { Session, SupabaseClient, User, UserAttributes } from '@supabase/supabase-js'

import { FEATURE } from '../templates/enums'
import { description, feature, log, severity, step } from '../../.jest/jest-custom-reporter'
import { Hooks } from './hooks'

@suite('rpc')
class Procedures extends Hooks {
  @feature(FEATURE.STORAGE)
  @severity(Severity.BLOCKER)
  @description('When you call rpc then you are able to receive its result')
  @test.skip
  async 'call rpc'() {
    // todo
  }
}
