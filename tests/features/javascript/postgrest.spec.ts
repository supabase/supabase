import { suite, test, timeout } from '@testdeck/jest'
import { faker } from '@faker-js/faker'
import { Severity } from 'allure-js-commons'

import { FEATURE } from '../templates/enums'
import { description, feature, log, severity, step } from '../../.jest/jest-custom-reporter'
import { Hooks } from './hooks'

@suite('postgrest')
class PostgREST extends Hooks {
  @feature(FEATURE.POSTGREST)
  @severity(Severity.BLOCKER)
  @description('User can insert profile for himself according to RLS to profiles table')
  @test
  async 'insert row'() {
    const { supabase, user } = await this.createSignedInSupaClient()

    // check if user can insert profile for himself
    const {
      data: [profileInserted],
      error: errorInsert,
    } = await this.insertProfile(supabase, user, user)
    expect(errorInsert).toBeNull()
    expect(profileInserted.username).toMatch(user.username)
  }

  @feature(FEATURE.POSTGREST)
  @severity(Severity.BLOCKER)
  @description('User can select his profile from profiles table')
  @test
  async 'select row'() {
    const { supabase, user } = await this.createSignedInSupaClient()

    // insert profile for user
    await this.insertProfile(supabase, user, user)

    const { data: profileGot, error } = await this.getUserProfile(supabase)
    expect(error).toBeNull()
    expect(profileGot.username).toMatch(user.username)
  }

  @feature(FEATURE.POSTGREST)
  @severity(Severity.BLOCKER)
  @description('User can update his profile in profiles table')
  @test
  async 'update row'() {
    const { supabase, user } = await this.createSignedInSupaClient()

    // insert profile for user
    await this.insertProfile(supabase, user, user)

    const newName = faker.internet.userName()
    // update profile for user
    const { data: updUser, error } = await supabase
      .from('profiles')
      .update({
        id: user.id,
        username: newName,
      })
      .select()
    expect(error).toBeNull()
    expect(updUser.length).toEqual(1)
    expect(updUser[0].username).toMatch(newName)

    const { data: profileGot } = await this.getUserProfile(supabase)
    expect(profileGot.username).toMatch(newName)
  }

  @feature(FEATURE.POSTGREST)
  @severity(Severity.BLOCKER)
  @description('User can delete his profile in profiles table')
  @test
  async 'delete row'() {
    const { supabase, user } = await this.createSignedInSupaClient()

    // insert profile for user
    await this.insertProfile(supabase, user, user)

    // delete profile for user
    const { error } = await supabase.from('profiles').delete().eq('id', user.id).select()
    expect(error).toBeNull()

    const { data: profileGot } = await this.getUserProfile(supabase)
    expect(profileGot).toBeNull()
  }
}
