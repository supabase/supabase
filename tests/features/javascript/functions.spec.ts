import { params, suite, test } from '@testdeck/jest'
import { faker } from '@faker-js/faker'
import { Severity } from 'allure-js-commons'
import { exec, ExecException } from 'child_process'
import os from 'os'

import { Session, SupabaseClient, User, UserAttributes } from '@supabase/supabase-js'

import { FEATURE } from '../templates/enums'
import { description, feature, log, severity, step } from '../../.jest/jest-custom-reporter'
import { Hooks } from './hooks'
import path from 'path'

@suite('functions')
class Functions extends Hooks {
  @feature(FEATURE.STORAGE)
  @severity(Severity.NORMAL)
  @description('When you get functions client then you are able to set auth')
  @test.skip
  async 'set auth'() {
    // execute cli command
    const deno = path.join(os.homedir(), '.supabase', 'deno')
    const funcPath = path.join(process.cwd(), 'data', 'func.ts')
    let prom = new Promise<{ error: ExecException; stdout: string; stderr: string }>((resolve) => {
      exec(`${deno} bundle --no-check=remote --quiet ${funcPath}`, (error, stdout, stderr) =>
        resolve({ error, stdout, stderr })
      )
    })
    const { supabase } = await this.createSignedInSupaClient()
    const sb = this.createSupaClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    sb.functions.setAuth(session.access_token)
    const { error, stdout, stderr } = await prom
    expect([null, undefined]).toContain(error)
    expect([null, undefined]).toContain(stderr)
    expect(stdout).toBeDefined()
    sb.functions.invoke('get_user')
  }
}
