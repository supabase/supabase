import { params, suite, test } from '@testdeck/jest'
import { faker } from '@faker-js/faker'
import { Severity } from 'allure-js-commons'

import { Session, SupabaseClient, User, UserAttributes } from '@supabase/supabase-js'

import { FEATURE } from '../templates/enums'
import { description, feature, log, severity, step } from '../../.jest/jest-custom-reporter'
import { Hooks } from './hooks'

@suite('authentication API')
class AuthenticationAPI extends Hooks {
  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When you create user then it has to be in auth db schema')
  @test.skip
  async 'create user'() {
    // todo
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When you create user then he can sign in')
  @test.skip
  async 'create user can login'() {
    // todo
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.CRITICAL)
  @description('When you try to create user with anon key then you should get error')
  @test.skip
  async 'create user with anon key'() {
    // todo
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When you list users then you should get all users')
  @test.skip
  async 'list users'() {
    // todo
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.CRITICAL)
  @description('When you try to list user with anon key then you should get error')
  @test.skip
  async 'list users with anon key'() {
    // todo
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When you sign up user with email then he should be able to login')
  @test.skip
  async 'sign up with email'() {
    // todo
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When you sign in user with email then he should be able to update his profile')
  @test.skip
  async 'sign in with email'() {
    // todo
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When you sign up user with phone then he should be able to login')
  @test.skip
  async 'sign up with phone'() {
    // todo
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When you sign in user with phone then he should be able to update his profile')
  @test.skip
  async 'sign in with phone'() {
    // todo
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When you send magic link then email should be sent to user')
  @test.skip
  async 'send magic link'() {
    // todo
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When you send invite then corresponding email should be sent to user')
  @test.skip
  async 'send invite link'() {
    // todo
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When you send reset password then corresponding email should be sent to user')
  @test.skip
  async 'send reset password'() {
    // todo
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When you sign out user then current session has to be removed')
  @test.skip
  async 'sign out'() {
    // todo
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When you get provider url then corresponding auth provider url should be returned')
  @params.skip({ provider: 'google', options: {}, expectedURL: 'todo' })
  @params.skip({
    provider: 'google',
    options: { redirectTo: 'todo', scopes: 'todo' },
    expectedURL: 'todo',
  })
  @params.skip({ provider: 'twitter', options: {}, expectedURL: 'todo' })
  // ...
  async 'get url for provider'() {
    // todo
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When you get user then currently logined user date has to be returned')
  @test.skip
  async 'get user'() {
    // todo
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When you update user then currently logined user date has to be updated')
  @test.skip
  async 'update user'() {
    // todo
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When you delete user then this user has to be deleted and unable to login')
  @test.skip
  async 'delete user'() {
    // todo
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.CRITICAL)
  @description('When you delete user with anon key you have to receive an error')
  @test.skip
  async 'delete user with anon key'() {
    // todo
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When you change auth cookie then all new requests should have new JWT')
  @test.skip
  async 'set auth cookie'() {
    // todo
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When you refreshes session then user and session have to be updated')
  @test.skip
  async 'refresh session'() {
    // todo
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When you get user by cookie then the corresponding user data has to be returned')
  @test.skip
  async 'get user by cookie'() {
    // todo
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When you generate link then the right link has to be returned')
  @params.skip({ type: 'signup', options: {}, email: 'todo' })
  @params.skip({
    type: 'signup',
    options: {
      redirectTo: 'todo',
      password: 'todo',
      data: {
        /* todo */
      },
    },
    email: 'todo',
  })
  @params.skip({ type: 'magiclink', options: {}, email: 'todo' })
  // ...
  async 'generate link'() {
    // todo
  }
}
