import { params, retries, suite, test } from '@testdeck/jest'
import { faker } from '@faker-js/faker'
import { Severity } from 'allure-js-commons'

import { AdminUserAttributes, AuthError, SupabaseClient, UserResponse } from '@supabase/supabase-js'

import { FEATURE } from '../templates/enums'
import { description, feature, log, severity, step } from '../../.jest/jest-custom-reporter'
import { Hooks } from './hooks'

@suite('auth_admin')
class AuthenticationAPI extends Hooks {
  @feature(FEATURE.AUTH_ADMIN)
  @severity(Severity.NORMAL)
  @description('When you create user then it has to be in auth db schema')
  @test
  async 'create user via admin api'() {
    const { user, error } = await this.createUserAsAdmin()
    expect(error).toBeNull()
    expect(user).not.toBeNull()
  }

  @feature(FEATURE.AUTH_ADMIN)
  @severity(Severity.NORMAL)
  @description('When you create user then he can sign in')
  @test
  async 'user created by admin can login'() {
    const { user, error } = await this.createUserAsAdmin()
    expect(error).toBeNull()
    expect(user).not.toBeNull()

    const supabase = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ADMIN)

    const {
      data: { user: createdUser },
      error: getErr,
    } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    })
    expect(getErr).toBeNull()
    expect(createdUser).not.toBeNull()
    expect(createdUser.id).toBe(user.id)
  }

  @feature(FEATURE.AUTH_ADMIN)
  @severity(Severity.CRITICAL)
  @description('When you try to create user with anon key then you should get error')
  @test
  async 'admin create user with anon key should fail'() {
    const fakeUser = {
      email: faker.internet.exampleEmail(),
      password: faker.internet.password(),
      email_confirm: true,
    }
    const supabase = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ANON)

    const {
      error,
      data: { user },
    } = await supabase.auth.admin.createUser(fakeUser)
    expect(user).toBeNull()
    expect(error).not.toBeNull()
  }

  @feature(FEATURE.AUTH_ADMIN)
  @severity(Severity.CRITICAL)
  @description('When you try to create user as logged in user then you should get error')
  @test
  async 'admin create user with logged in user should fail'() {
    const { user } = await this.createUserAsAdmin()

    const supabase = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ANON)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    })
    expect(signInError).toBeNull()

    const fakeUser = {
      email: faker.internet.exampleEmail(),
      password: faker.internet.password(),
    }
    const {
      error,
      data: { user: newUser },
    } = await supabase.auth.admin.createUser(fakeUser)
    expect(newUser).toBeNull()
    expect(error).not.toBeNull()
  }

  @feature(FEATURE.AUTH_ADMIN)
  @severity(Severity.NORMAL)
  @description('When you list users then you should get all users')
  @test
  async 'list users with service key'() {
    const { user: user1 } = await this.createUserAsAdmin()
    const { user: user2 } = await this.createUserAsAdmin()

    const supabase = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ADMIN)
    const {
      data: { users },
      error,
    } = await supabase.auth.admin.listUsers()

    expect(error).toBeNull()
    expect(users).not.toBeNull()
    expect(users.length).toBeGreaterThanOrEqual(2)
    expect(users.map((u) => u.id)).toEqual(expect.arrayContaining([user1.id, user2.id]))
  }

  @feature(FEATURE.AUTH_ADMIN)
  @severity(Severity.CRITICAL)
  @description('When you try to list user with anon key then you should get error')
  @test
  async 'list users with anon key should fail'() {
    await this.createUserAsAdmin()
    await this.createUserAsAdmin()

    const supabase = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ANON)
    const {
      data: { users },
      error,
    } = await supabase.auth.admin.listUsers()

    expect(error).not.toBeNull()
    expect(users).toHaveLength(0)
  }

  @feature(FEATURE.AUTH_ADMIN)
  @severity(Severity.CRITICAL)
  @description('When you try to list user as logged in user then you should get error')
  @test
  async 'list users as logged in user should fail'() {
    const { user } = await this.createUserAsAdmin()
    await this.createUserAsAdmin()

    const supabase = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ANON)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    })
    expect(signInError).toBeNull()

    const {
      data: { users },
      error,
    } = await supabase.auth.admin.listUsers()
    expect(error).not.toBeNull()
    expect(users).toHaveLength(0)
  }

  @feature(FEATURE.AUTH_ADMIN)
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

  @feature(FEATURE.AUTH_ADMIN)
  @severity(Severity.NORMAL)
  @description('When you get user by id he has to be returned')
  @test
  async 'get user should work'() {
    const { user } = await this.createUserAsAdmin()

    const supabase = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ADMIN)
    const {
      data: { user: foundUser },
      error,
    } = await supabase.auth.admin.getUserById(user.id)

    expect(error).toBeNull()
    expect(foundUser).not.toBeNull()
    expect(foundUser.id).toBe(user.id)
    expect(foundUser.email).toBe(user.email)
  }

  @feature(FEATURE.AUTH_ADMIN)
  @severity(Severity.NORMAL)
  @description('When you update user then this user has to be updated')
  @test
  async 'update user should work'() {
    const { user } = await this.createUserAsAdmin()

    const supabase = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ADMIN)

    const updatedUser = {
      email: faker.internet.exampleEmail(),
      phone: faker.phone.phoneNumber('!#!##!######'),
    }
    let {
      data: { user: resultUser },
      error,
    } = await this.updateWithRetries(supabase, user.id, updatedUser)

    expect(error).toBeNull()
    expect(resultUser).not.toBeNull()
    expect(resultUser.id).toBe(user.id)
    expect(resultUser.email).toBe(updatedUser.email)
    expect(resultUser.phone).toBe(updatedUser.phone)
  }

  @feature(FEATURE.AUTH_ADMIN)
  @severity(Severity.NORMAL)
  @description('When you delete user then this user has to be removed')
  @test
  async 'delete user should work'() {
    const { user } = await this.createUserAsAdmin()

    const supabase = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ADMIN)
    const {
      data: { user: deletedUser },
      error,
    } = await supabase.auth.admin.deleteUser(user.id)
    expect(error).toBeNull()

    const {
      data: { user: foundUser },
      error: getError,
    } = await supabase.auth.admin.getUserById(user.id)
    expect(getError).not.toBeNull()
    expect(foundUser).toBeNull()
  }

  @feature(FEATURE.AUTH_ADMIN)
  @severity(Severity.CRITICAL)
  @description('When you delete user with anon key you have to receive an error')
  @test
  async 'delete user with anon key should fail'() {
    const { user } = await this.createUserAsAdmin()
    const { user: villain } = await this.createUserAsAdmin()

    const supabase = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ANON)
    await supabase.auth.signInWithPassword({
      email: villain.email,
      password: villain.password,
    })

    const {
      data: { user: deletedUser },
      error,
    } = await supabase.auth.admin.deleteUser(user.id)

    expect(error).not.toBeNull()
    expect(deletedUser).toBeNull()

    const sbAdmin = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ADMIN)
    const {
      data: { user: foundUser },
      error: getError,
    } = await sbAdmin.auth.admin.getUserById(user.id)
    expect(getError).toBeNull()
    expect(foundUser).not.toBeNull()
    expect(foundUser.email).toBe(user.email)
  }

  @step('Create a user as admin')
  async createUserAsAdmin(data: AdminUserAttributes = undefined): Promise<{
    user: {
      email: string
      password: string
      username: string
      id: string
    }
    error: AuthError
  }> {
    const supabase = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY_ADMIN)

    let fakeUser: AdminUserAttributes
    if (data) {
      fakeUser = data
    } else {
      fakeUser = {
        email: faker.internet.exampleEmail(),
        password: faker.internet.password(),
        email_confirm: true,
      }
    }

    const {
      error,
      data: { user },
    } = await supabase.auth.admin.createUser(fakeUser)

    return {
      error: error,
      user: {
        email: user?.email,
        password: fakeUser.password,
        username: faker.internet.userName(),
        id: user?.id,
      },
    }
  }

  @step('Update user with retries')
  async updateWithRetries(supabase: SupabaseClient, uid: string, attributes: AdminUserAttributes) {
    let result: UserResponse
    for (let i = 1; i < 5; i++) {
      result = await supabase.auth.admin.updateUserById(uid, attributes)

      if (result.error && result.error.name === 'AuthRetryableFetchError') {
        await new Promise((resolve) => setTimeout(resolve, 1000 * i))
      } else {
        break
      }
    }
    return result
  }
}
