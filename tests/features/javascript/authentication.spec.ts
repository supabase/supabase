import { suite, test, timeout } from '@testdeck/jest'
import { faker } from '@faker-js/faker'
import { Severity } from 'allure-js-commons'

import { AuthChangeEvent, Session } from '@supabase/supabase-js'

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
    const {
      data: { user, session },
      error: signUpError,
    } = await this.signUp(supabase, fakeUser)

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
  async 'sing up new user and sign in'() {
    // sign up user
    const supabase = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ANON)

    const fakeUser = {
      email: faker.internet.exampleEmail(),
      password: faker.internet.password(),
      username: faker.internet.userName(),
    }
    const {
      data: { user, session: emptySession },
      error: signUpError,
    } = await this.signUp(supabase, fakeUser)

    expect(signUpError).toBeNull()
    expect(user).toBeDefined()
    expect(user.email).toEqual(fakeUser.email.toLowerCase())
    expect(emptySession).not.toBeNull()

    const {
      data: { session },
      error: signInError,
    } = await supabase.auth.signInWithPassword({
      email: fakeUser.email,
      password: fakeUser.password,
    })
    expect(signInError).toBeNull()
    expect(session).toBeDefined()
    await supabase.auth.setSession(session)

    // check if user is signed in
    const {
      data: [profile],
      error: errorInsert,
    } = await this.insertProfile(supabase, user, fakeUser)
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
  async 'create new users by phone auth'() {
    // sign up user
    const supabase = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ANON)

    const fakeUser = {
      password: faker.internet.password(),
      username: faker.internet.userName(),
      phone: faker.phone.phoneNumber('!#!##!######'),
    }
    const {
      data: { user, session },
      error: signUpError,
    } = await this.signUpByPhone(supabase, fakeUser)

    expect(signUpError).toBeNull()
    expect(user).toBeDefined()
    expect(user.phone).toEqual(fakeUser.phone)
    expect(session).toBeDefined()

    // check if user is signed in
    const {
      data: [profile],
      error: errorInsert,
    } = await this.insertProfile(supabase, user, fakeUser)
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
  async 'existing users should be able to login'() {
    // create user
    const fakeUser = await this.createUser()

    // sign in as user
    const supabase = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ANON)
    const {
      data: { session, user },
      error: signInError,
    } = await supabase.auth.signInWithPassword({
      email: fakeUser.email,
      password: fakeUser.password,
    })

    expect(signInError).toBeNull()
    expect(session).toBeDefined()
    expect(user).toBeDefined()
    expect(user.email).toEqual(fakeUser.email.toLowerCase())

    // check if user is signed in correctly and rls is working
    const {
      data: [profileInserted],
      error: errorInsert,
    } = await this.insertProfile(supabase, user, fakeUser)
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
  async 'get user should return logged in user'() {
    // create user
    const username = faker.internet.userName()
    const date = faker.date.recent().toUTCString()
    const fakeUser = await this.createUser({
      username: username,
      date: date,
    })

    // sign in as user
    const supabase = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ANON)
    await supabase.auth.signInWithPassword({
      email: fakeUser.email,
      password: fakeUser.password,
    })

    // get signed in user data
    const {
      data: { user },
      error: getUserErr,
    } = await this.getUser(supabase)

    log('Check if user is signed in correctly and can get his data')
    expect(getUserErr).toBeNull()
    expect(user).not.toBeNull()
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
  async 'update user should update logged in user'() {
    // create user
    const fakeUser = await this.createUser()

    // sign in as user
    const supabase = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ANON)
    await supabase.auth.signInWithPassword({
      email: fakeUser.email,
      password: fakeUser.password,
    })

    // get signed in user data
    const user = await this.getUser(supabase)

    // update user
    const updParams = {
      email: faker.internet.email(),
      password: faker.internet.password(),
      phone: faker.phone.phoneNumber('!#!##!######'),
    }
    const {
      data: { user: updUser },
      error: updUserError,
    } = await this.updateUser(supabase, updParams)
    expect(updUserError).toBeNull()
    expect(updUser).not.toBeNull()
    expect(updUser.email).toEqual(updParams.email.toLowerCase())
    expect(updUser.phone).toEqual(updParams.phone)

    // get user and check it was updated
    const updatedUser = await this.getUser(supabase)
    expect(updatedUser.data.user.email).toEqual(updParams.email.toLowerCase())
    expect(updatedUser.data.user.phone).toEqual(updParams.phone)

    // sign in with new credentials
    await supabase.auth.signOut()
    const signIn = await supabase.auth.signInWithPassword({
      email: updParams.email,
      password: updParams.password,
    })
    expect(signIn.error).toBeNull()
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When user changes session then he still should be correctly logined')
  @test
  async 'set session should set new auth'() {
    // create user
    const fakeUser = await this.createUser()

    // sign in as user
    const sb = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ANON)
    const {
      data: { session },
    } = await sb.auth.signInWithPassword({
      email: fakeUser.email,
      password: fakeUser.password,
    })

    const supabase = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ANON)
    const { error: sessionErr } = await supabase.auth.setSession(session)
    expect(sessionErr).toBeNull()

    // check if user is signed in correctly and rls is working
    const { data: profileInserted, error: errorInsert } = await this.insertProfile(
      supabase,
      fakeUser,
      fakeUser
    )
    expect(errorInsert).toBeNull()
    expect(profileInserted).toHaveLength(1)
    expect(profileInserted[0].username).toMatch(fakeUser.username)
  }

  @feature(FEATURE.AUTHENTICATION)
  @severity(Severity.NORMAL)
  @description('When user subscribes on auth changes then user has to receive auth updates')
  @test
  async 'on auth state changed should return events'() {
    // create user
    const fakeUser = await this.createUser()
    const events: { event: AuthChangeEvent; token: string }[] = []
    const onAuthStateChanged = (event: AuthChangeEvent, session: Session) => {
      log('onAuthStateChanged triggered', event)
      events.push({ event, token: session?.access_token })
    }

    // create client and subscribe on auth state changes
    const supabase = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ANON)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(onAuthStateChanged)

    // sign in as user
    await supabase.auth.signInWithPassword({
      email: fakeUser.email,
      password: fakeUser.password,
    })

    // update user
    const updParams = {
      email: faker.internet.email(),
      password: faker.internet.password(),
      phone: faker.phone.phoneNumber('!#!##!######'),
    }
    const { error: updUserError } = await this.updateUser(supabase, updParams)
    expect(updUserError).toBeNull()

    // remove subscription and sign out
    subscription.unsubscribe()
    await supabase.auth.signOut()

    // check if sign in and update events were triggered and sign out event was not triggered
    expect(events).toHaveLength(2)
    expect(events.map((e) => e.event)).toEqual(
      expect.arrayContaining(['SIGNED_IN', 'USER_UPDATED'])
    )
    expect(events.map((e) => e.event)).not.toContain('SIGNED_OUT')
  }
}
