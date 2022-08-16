import postgres from 'postgres'
import crossFetch from 'cross-fetch'
import { faker } from '@faker-js/faker'
import {
  ApiError,
  createClient,
  Session,
  SupabaseClient,
  SupabaseClientOptions,
  User,
} from '@supabase/supabase-js'

import { JasmineAllureReporter, step } from '../../.jest/jest-custom-reporter'

export abstract class Hooks {
  static sql = postgres({
    host: process.env.SUPABASE_DB_HOST,
    port: parseInt(process.env.SUPABASE_DB_PORT),
    database: 'postgres',
    username: 'postgres',
    password: process.env.SUPABASE_DB_PASS,
  })

  @step('terminate sql connection')
  static async after(): Promise<any> {
    try {
      Hooks.sql.end({ timeout: 100 })
      return Promise.resolve(null)
    } catch (err) {
      return Promise.reject(err)
    }
  }

  @step('Create Supabase client')
  createSupaClient(url: string, key: string, options: SupabaseClientOptions = {}): SupabaseClient {
    return createClient(url, key, options)
  }

  @step('Create a valid user')
  async createUser(data: object = {}): Promise<{
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

    return fakeUser
  }

  // todo: rework this
  @step((token: string) => `verify with token ${token}`)
  async verify(token: string, email: string): Promise<Response> {
    return crossFetch(`${process.env.SUPABASE_GOTRUE}/verify`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'signup',
        token: token,
        email: email,
      }),
    })
  }

  @step((user: User) => `get confirmation token for user ${user.id}`)
  async getConfirmationToken(user: User): Promise<[{ confirmation_token: any }]> {
    return Hooks.sql`
      select confirmation_token 
      from auth.users
      where id = ${user.id}
    `
  }

  @step('I sign up with a valid email and password')
  async signUp(
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

  @step('Check if I am being able to log out')
  async signOut(supabase: SupabaseClient): Promise<{ error: any }> {
    return supabase.auth.signOut()
  }

  @step('Get user data, if there is a logged in user')
  getUser(supabase: SupabaseClient) {
    return supabase.auth.user()
  }

  @step((user: User) => `Get user by ID (${user.id}) from Supabase auth schema`)
  async selectUser(user: User): Promise<[{ email: string }]> {
    return Hooks.sql`
        select
        email
      from auth.users
      where
        id = ${user.id}
    `
  }
}
