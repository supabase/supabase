import { params, suite, test } from '@testdeck/jest'
import { faker } from '@faker-js/faker'
import { Severity } from 'allure-js-commons'

import { Session, SupabaseClient, User, UserAttributes } from '@supabase/supabase-js'

import { FEATURE } from '../templates/enums'
import { description, feature, log, severity, step } from '../../.jest/jest-custom-reporter'
import { Hooks } from './hooks'

@suite('functions')
class Functions extends Hooks {
  @feature(FEATURE.STORAGE)
  @severity(Severity.NORMAL)
  @description('When you get functions client then you are able to set auth')
  @test.skip
  async 'set auth'() {
    // todo
  }
}
