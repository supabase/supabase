import { params, suite, test } from '@testdeck/jest'
import { faker } from '@faker-js/faker'
import { Severity } from 'allure-js-commons'

import { Session, SupabaseClient, User, UserAttributes } from '@supabase/supabase-js'

import { FEATURE } from '../templates/enums'
import { description, feature, log, severity, step } from '../../.jest/jest-custom-reporter'
import { Hooks } from './hooks'

@suite('storage')
class Storage extends Hooks {
  @feature(FEATURE.STORAGE)
  @severity(Severity.BLOCKER)
  @description('When you create public bucket then it has to be available')
  @test.skip
  async 'create public bucket'() {
    // todo
  }

  @feature(FEATURE.STORAGE)
  @severity(Severity.BLOCKER)
  @description('When you create private bucket then it has to be available')
  @test.skip
  async 'create private bucket'() {
    // todo
  }
}
