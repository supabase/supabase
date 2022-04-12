import { suite, test } from '@testdeck/jest'
import { faker } from '@faker-js/faker'
import { Severity } from 'allure-js-commons'
import postgres from 'postgres'
import crossFetch from 'cross-fetch'

import {
  ApiError,
  createClient,
  Session,
  SupabaseClient,
  SupabaseClientOptions,
  User,
} from '@supabase/supabase-js'

import { FEATURE } from '../templates/enums'
import { description, feature, log, severity, step } from '../../.jest/jest-custom-reporter'

@suite('authentication')
class Authentication {
  private static sql = postgres({
    host: process.env.SUPABASE_DB_HOST,
    port: parseInt(process.env.SUPABASE_DB_PORT),
    database: 'postgres',
    username: 'postgres',
    password: 'postgres',
  })

  @step('terminate sql connection')
  static async after(): Promise<any> {
    try {
      Authentication.sql.end({ timeout: 100 })
      return Promise.resolve(null)
    } catch (err) {
      return Promise.reject(err)
    }
  }

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

    expect(user).toBeDefined()
    expect(user.email).toEqual(fakeUser.email.toLowerCase())
    expect(session).toBeDefined()
    expect(signUpError).toBeNull()

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
    const { user, error: signUpError } = await this.signUp(supabase, fakeUser)

    expect(user).toBeDefined()
    expect(user.email).toEqual(fakeUser.email.toLowerCase())
    expect(signUpError).toBeNull()

    // check if user is not signed in cause he has not confirmed his email
    const { error: errorInsertFailed } = await this.insertProfile(supabase, user, fakeUser)
    log('check if insert failed caused user has not confirmed email')
    expect(errorInsertFailed).not.toBeNull()

    // confirm user email and sign in
    const [{ confirmation_token: token }] = await this.getConfirmationToken(user)
    const verifyResponse = await this.verify(token)
    expect(verifyResponse.ok).toBeTruthy()

    const { error: signInError } = await supabase.auth.signIn({
      email: fakeUser.email,
      password: fakeUser.password,
    })
    expect(signInError).toBeNull()

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

    expect(user).toBeDefined()
    expect(user.phone).toEqual(fakeUser.phone)
    expect(session).toBeDefined()
    expect(signUpError).toBeNull()

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

    expect(user).toBeDefined()
    expect(user.email).toEqual(fakeUser.email.toLowerCase())
    expect(session).toBeDefined()
    expect(signInError).toBeNull()

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

  // steps

  @step('Create Supabase client')
  private createSupaClient(
    url: string,
    key: string,
    options: SupabaseClientOptions = {}
  ): SupabaseClient {
    return createClient(url, key, options)
  }

  @step('Create a valid user')
  private async createUser(data: object = {}): Promise<{
    email: string
    password: string
    username: string
  }> {
    const supabase = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ANON)

    const fakeUser = {
      email: faker.internet.exampleEmail(),
      password: faker.internet.password(),
      username: faker.internet.userName(),
    }
    const { user, error: signUpError } = await this.signUp(supabase, fakeUser, {
      data: data,
    })
    expect(signUpError).toBeNull()

    const [{ confirmation_token: token }] = await this.getConfirmationToken(user)

    await this.verify(token)

    return fakeUser
  }

  @step((token: string) => `verify with token ${token}`)
  private async verify(token: string): Promise<Response> {
    return crossFetch(`${process.env.SUPABASE_GOTRUE}/verify`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'signup',
        token: token,
      }),
    })
  }

  @step((user: User) => `get confirmation token for user ${user.id}`)
  private async getConfirmationToken(user: User): Promise<[{ confirmation_token: any }]> {
    return Authentication.sql`
      select confirmation_token 
      from auth.users
      where id = ${user.id}
    `
  }

  @step('I sign up with a valid email and password')
  private async signUp(
    supabase: SupabaseClient,
    {
      email = faker.internet.exampleEmail(),
      password = faker.internet.password(),
    }: {
      email?: string
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
        email: email,
        password: password,
      },
      options
    )
  }

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

  @step('Check if I am being able to log out')
  private signOut(supabase: SupabaseClient): { error: any } | PromiseLike<{ error: any }> {
    return supabase.auth.signOut()
  }

  @step('Get user data, if there is a logged in user')
  private getUser(supabase: SupabaseClient) {
    return supabase.auth.user()
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

  @step((user: User) => `Get user by ID (${user.id}) from Supabase auth schema`)
  private async selectUser(user: User): Promise<[{ email: string }]> {
    return Authentication.sql`
        select
        email
      from auth.users
      where
        id = ${user.id}
    `
  }
}
