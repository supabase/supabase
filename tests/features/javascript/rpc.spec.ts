import { suite, test, timeout } from '@testdeck/jest'
import { Severity } from 'allure-js-commons'

import { SupabaseClient } from '@supabase/supabase-js'

import { FEATURE } from '../templates/enums'
import { description, feature, severity, step } from '../../.jest/jest-custom-reporter'
import { Hooks } from './hooks'
import { PendingQuery, Row } from 'postgres'

@suite('rpc')
@timeout(30000)
class Procedures extends Hooks {
  @feature(FEATURE.RPC)
  @severity(Severity.BLOCKER)
  @description('When you call rpc then you are able to receive its result')
  @test
  async 'call rpc and get result'() {
    await this.createFunction(Procedures.sql`
    CREATE OR REPLACE FUNCTION public.test_procedure() RETURNS int language plpgsql as $$
    declare
       profile_count integer;
    begin
       select count(*) 
       into profile_count
       from profiles;
       
       return profile_count;
    end;
    $$;`)

    const { supabase, user } = await this.createSignedInSupaClient()
    await this.insertProfile(supabase, user, user)

    const result = await this.callRpc(supabase, 'test_procedure')
    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()
    expect(result.data).toBeGreaterThanOrEqual(1)

    await this.dropFunction(Procedures.sql`test_procedure()`)
  }

  @feature(FEATURE.RPC)
  @severity(Severity.BLOCKER)
  @description('When you call rpc, params should be passed properly')
  @test
  async 'call rpc method that has params'() {
    await this.createFunction(Procedures.sql`
    CREATE OR REPLACE FUNCTION public.test_procedure(filter text) 
      RETURNS int language plpgsql as $$
    declare
       profile_count integer;
    begin
       select count(*) 
       into profile_count
       from profiles
       where username LIKE '%' || filter || '%';
       
       return profile_count;
    end;
    $$;`)

    const { supabase, user } = await this.createSignedInSupaClient()
    await this.insertProfile(supabase, user, user)

    const result = await this.callRpc(supabase, 'test_procedure', { filter: user.username })
    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()
    expect(result.data).toBeGreaterThanOrEqual(1)

    await this.dropFunction(Procedures.sql`test_procedure(filter text)`)
  }

  @feature(FEATURE.RPC)
  @severity(Severity.NORMAL)
  @description('When you call rpc with head param, no data should be returned')
  @test
  async 'call rpc with head option'() {
    await this.createFunction(Procedures.sql`
    CREATE OR REPLACE FUNCTION public.test_procedure() RETURNS int language plpgsql as $$
    declare
       profile_count integer;
    begin
       select count(*) 
       into profile_count
       from profiles;
       
       return profile_count;
    end;
    $$;`)

    const { supabase, user } = await this.createSignedInSupaClient()
    await this.insertProfile(supabase, user, user)

    const result = await this.callRpc(supabase, 'test_procedure', {}, { head: true })
    expect(result.error).toBeNull()
    expect(result.data).toBeNull()

    await this.dropFunction(Procedures.sql`test_procedure()`)
  }

  @step('create function')
  private async createFunction(body: PendingQuery<Row[]>) {
    await Procedures.sql`${body}`
    await Procedures.sql`NOTIFY pgrst, 'reload schema';`
  }

  @step('drop function')
  private async dropFunction(signature: PendingQuery<Row[]>) {
    await Procedures.sql`DROP FUNCTION public.${signature};`
  }

  @step('call supabase rpc')
  private async callRpc(
    supabase: SupabaseClient,
    name: string,
    args?: any,
    options?: {
      head?: boolean
      count?: 'exact' | 'planned' | 'estimated'
    }
  ) {
    let result = await supabase.rpc(name, args, options)
    for (let i = 1; i <= 5; i++) {
      if (result.error) {
        await new Promise((resolve) => setTimeout(resolve, 0.5 * 1000 * i))
        result = await supabase.rpc(name, args, options)
      } else {
        break
      }
    }
    return result
  }
}
