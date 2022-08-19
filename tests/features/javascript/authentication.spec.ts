import { suite, test } from '@testdeck/jest'
import { faker } from '@faker-js/faker'
import { Severity } from 'allure-js-commons'

import { ApiError, Session, SupabaseClient, User, UserAttributes } from '@supabase/supabase-js'

import { FEATURE } from '../templates/enums'
import { description, feature, log, severity, step } from '../../.jest/jest-custom-reporter'
import { Hooks } from './hooks'

@suite('authentication')
class Authentication extends Hooks {
  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.BLOCKER)
  @description('When user sign up then corresponding user in auth schema should be created')
  @test
  async 'signup should create user'() {
    const supabase = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ANON)

    const fakeUser = {
      email: faker.internet.exampleEmail(),
      password: faker.internet.password(),
      username: faker.internet.userName(),
    }
    const { user, session, error: signUpError } = await this.signUp(supabase, fakeUser)

    expect(signUpError).toBeNull()
    expect(user).toBeDefined()
    expect(user.email).toEqual(fakeUser.email.toLowerCase())
    expect(session).toBeDefined()

    const [createdUser] = await this.selectUser(user)
    expect(createdUser.email).toEqual(fakeUser.email.toLowerCase())
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.BLOCKER)
  @description('When user sign up then he should not be logged in until he confirms his email')
  @test
  async 'new users'() {
    // sign up user
    const supabase = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ANON)

    const fakeUser = {
      email: faker.internet.exampleEmail(),
      password: faker.internet.password(),
      username: faker.internet.userName(),
    }
    const {
      user,
      session: emptySession,
      error: signUpError,
    } = await this.signUp(supabase, fakeUser)

    expect(signUpError).toBeNull()
    expect(user).toBeDefined()
    expect(user.email).toEqual(fakeUser.email.toLowerCase())
    expect(emptySession).not.toBeNull()

    const { session, error: signInError } = await supabase.auth.signIn({
      email: fakeUser.email,
      password: fakeUser.password,
    })
    expect(signInError).toBeNull()
    expect(session).toBeDefined()

    // check if user is signed in
    const { data: profile, error: errorInsert } = await this.insertProfile(supabase, user, fakeUser)
    expect(errorInsert).toBeNull()
    expect(profile.username).toMatch(fakeUser.username)

    const { data: profileGot } = await this.getUserProfile(supabase)
    expect(profileGot.username).toMatch(profile.username)

    // check if user is able to sign out
    const { error } = await this.signOut(supabase)
    expect(error).toBeNull()
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.BLOCKER)
  @description('When user sign up with phone then he should be logged in')
  @test
  async 'new users by phone'() {
    // sign up user
    const supabase = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ANON)

    const fakeUser = {
      password: faker.internet.password(),
      username: faker.internet.userName(),
      phone: faker.phone.phoneNumber('!#!##!######'),
    }
    const { user, session, error: signUpError } = await this.signUpByPhone(supabase, fakeUser)

    expect(signUpError).toBeNull()
    expect(user).toBeDefined()
    expect(user.phone).toEqual(fakeUser.phone)
    expect(session).toBeDefined()

    // check if user is signed in
    const { data: profile, error: errorInsert } = await this.insertProfile(supabase, user, fakeUser)
    expect(errorInsert).toBeNull()
    expect(profile.username).toMatch(fakeUser.username)

    const { data: profileGot } = await this.getUserProfile(supabase)
    expect(profileGot.username).toMatch(profile.username)

    // check if user is able to sign out
    const { error } = await this.signOut(supabase)
    expect(error).toBeNull()
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.BLOCKER)
  @description('When user is already signed up then he should be able to log in')
  @test
  async 'existing users'() {
    // create user
    const fakeUser = await this.createUser()

    // sign in as user
    const supabase = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ANON)
    const {
      session,
      user,
      error: signInError,
    } = await supabase.auth.signIn({
      email: fakeUser.email,
      password: fakeUser.password,
    })

    expect(signInError).toBeNull()
    expect(session).toBeDefined()
    expect(user).toBeDefined()
    expect(user.email).toEqual(fakeUser.email.toLowerCase())

    // check if user is signed in correctly and rls is working
    const { data: profileInserted, error: errorInsert } = await this.insertProfile(
      supabase,
      user,
      fakeUser
    )
    expect(errorInsert).toBeNull()
    expect(profileInserted.username).toMatch(fakeUser.username)

    const { data: profileGot } = await this.getUserProfile(supabase)
    expect(profileGot.username).toMatch(profileInserted.username)

    // check if user is able to sign out
    const { error } = await this.signOut(supabase)
    expect(error).toBeNull()
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When user is signed in then he should be able to get his info and metadata')
  @test
  async 'get user'() {
    // create user
    const username = faker.internet.userName()
    const date = faker.date.recent().toUTCString()
    const fakeUser = await this.createUser({
      username: username,
      date: date,
    })

    // sign in as user
    const supabase = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ANON)
    await supabase.auth.signIn({
      email: fakeUser.email,
      password: fakeUser.password,
    })

    // get signed in user data
    const user = this.getUser(supabase)

    log('Check if user is signed in correctly and can get his data')
    expect(user).toBeDefined()
    expect(user.email).toEqual(fakeUser.email.toLowerCase())
    expect(user.role).toEqual('authenticated')
    expect(user.aud).toEqual('authenticated')
    // verify if metadata is correctly set after sing up
    expect(user.user_metadata).toEqual({
      username: username,
      date: date,
    })
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When user is signed in then he should be able update himself in auth schema')
  @test.skip
  async 'update user'() {
    // create user
    const fakeUser = await this.createUser()

    // sign in as user
    const supabase = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ANON)
    await supabase.auth.signIn({
      email: fakeUser.email,
      password: fakeUser.password,
    })

    // get signed in user data
    const user = this.getUser(supabase)

    // update user
    // todo update params
    const {
      user: updUser,
      data: updUserData,
      error: updUserError,
    } = await this.updateUser(supabase, {})

    // todo check if returned user is updated

    const updatedUser = this.getUser(supabase)

    // todo check if user is updated on backend
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When user changes session then he still should be correctly logined')
  @test.skip
  async 'set session'() {
    // todo
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When user changes auth then all new requests should have new JWT')
  @test.skip
  async 'set auth'() {
    // todo
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When user refreshes session then user and session have to be updated')
  @test.skip
  async 'refresh session'() {
    // todo
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When user subscribes on auth changes then user has to receive auth updates')
  @test.skip
  async 'on auth state changed'() {
    // todo
  }

  // steps

  @step('I sign up with a valid email and password')
  private async signUpByPhone(
    supabase: SupabaseClient,
    {
      phone = faker.phone.phoneNumber(),
      password = faker.internet.password(),
    }: {
      phone?: string
      password?: string
    } = {},
    options: {
      redirectTo?: string
      data?: object
    } = {}
  ): Promise<{
    user: User
    session: Session
    error: ApiError
  }> {
    return supabase.auth.signUp(
      {
        phone: phone,
        password: password,
      },
      options
    )
  }

  @step('Check if I am logged in by checking if I can insert my profile')
  private async insertProfile(
    supabase: SupabaseClient,
    user: User,
    fakeUser: {
      username: string
    }
  ): Promise<{ data: any; error: any }> {
    return supabase
      .from('profiles')
      .insert({
        id: user.id,
        username: fakeUser.username,
      })
      .single()
  }

  @step('Check if I am logged in by checking if I can get my profile')
  private async getUserProfile(supabase: SupabaseClient): Promise<{ data: any }> {
    return supabase.from('profiles').select().maybeSingle()
  }

  @step('Update user info')
  private async updateUser(
    supabase: SupabaseClient,
    attr: UserAttributes
  ): Promise<{
    data: User
    user: User
    error: ApiError
  }> {
    return supabase.auth.update(attr)
  }
}
