import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { UPDATE_GOTRUE_CONFIG_FIELDS, WRITABLE_GOTRUE_CONFIG_FIELDS } from './fields'
import {
  AuthConfigValidationError,
  FileSystemAuthConfigStore,
  listConfigFileNames,
  parseDotenv,
  parseGoDuration,
  serializeDotenv,
  STUDIO_MANAGED_FILENAME,
} from './fileStore'

describe('api/self-hosted/auth-config/fileStore', () => {
  let dir: string
  let store: FileSystemAuthConfigStore

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'auth-config-'))
    store = new FileSystemAuthConfigStore(dir)
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  const write = (name: string, content: string) => writeFileSync(path.join(dir, name), content)

  describe('parseDotenv / serializeDotenv', () => {
    it('parses comments, export prefix and quoted values', () => {
      expect(
        parseDotenv(
          [
            '# comment',
            '',
            'A=1',
            'export B=two',
            `C='three'`,
            'D="say \\"hi\\""',
            'E="line\\nbreak"',
          ].join('\n')
        )
      ).toEqual({ A: '1', B: 'two', C: 'three', D: 'say "hi"', E: 'line\nbreak' })
    })

    it('round-trips values that need quoting', () => {
      const map = {
        GOTRUE_SITE_URL: 'http://localhost:3000',
        GOTRUE_URI_ALLOW_LIST: 'https://a.com, https://b.com',
        GOTRUE_EMPTY: '',
        GOTRUE_TEMPLATE: '<p>{{ .ConfirmationURL }}</p>\n#notacomment',
      }
      expect(parseDotenv(serializeDotenv(map))).toEqual(map)
    })
  })

  describe('listConfigFileNames', () => {
    it('sorts alphabetically and lets a sibling .json win over .env', () => {
      expect(
        listConfigFileNames(['10-b.env', '00-a.env', '00-a.json', 'readme.md', '20-c.json'])
      ).toEqual(['00-a.json', '10-b.env', '20-c.json'])
    })
  })

  describe('readEnvMap', () => {
    it('returns empty map when the folder does not exist', async () => {
      const missing = new FileSystemAuthConfigStore(path.join(dir, 'missing'))
      await expect(missing.readEnvMap()).resolves.toEqual({})
    })

    it('merges files in alphabetical order, later files win', async () => {
      write('00-base.env', 'GOTRUE_A=base\nGOTRUE_B=base\n')
      write('99-override.env', 'GOTRUE_B=override\n')
      await expect(store.readEnvMap()).resolves.toEqual({
        GOTRUE_A: 'base',
        GOTRUE_B: 'override',
      })
    })

    it('ignores directories and non env/json files', async () => {
      mkdirSync(path.join(dir, 'nested.env'))
      write('notes.txt', 'GOTRUE_A=nope\n')
      write('10-real.env', 'GOTRUE_A=yes\n')
      await expect(store.readEnvMap()).resolves.toEqual({ GOTRUE_A: 'yes' })
    })

    it('applies sibling .json instead of .env', async () => {
      write('00-a.env', 'GOTRUE_A=env\n')
      write('00-a.json', '{ "GOTRUE_A": "json" }')
      await expect(store.readEnvMap()).resolves.toEqual({ GOTRUE_A: 'json' })
    })
  })

  describe('getConfig', () => {
    it('returns null for fields that are not set', async () => {
      const config = await store.getConfig()
      expect(config.DISABLE_SIGNUP).toBeNull()
      expect(config.SMTP_HOST).toBeNull()
      expect(config.JWT_EXP).toBeNull()
    })

    it('coerces booleans, numbers and strings', async () => {
      write(
        '10-test.env',
        [
          'GOTRUE_DISABLE_SIGNUP=true',
          'GOTRUE_JWT_EXP=7200',
          'GOTRUE_SITE_URL=https://example.com',
          'GOTRUE_DB_MAX_POOL_SIZE=not-a-number',
        ].join('\n')
      )
      const config = await store.getConfig()
      expect(config.DISABLE_SIGNUP).toBe(true)
      expect(config.JWT_EXP).toBe(7200)
      expect(config.SITE_URL).toBe('https://example.com')
      expect(config.DB_MAX_POOL_SIZE).toBeNull()
    })
  })

  describe('updateConfig', () => {
    it('writes allowed fields to the studio-managed file as env vars', async () => {
      await store.updateConfig(
        { EXTERNAL_EMAIL_ENABLED: false, JWT_EXP: 7200, SMTP_PORT: '2500' },
        UPDATE_GOTRUE_CONFIG_FIELDS
      )

      const raw = readFileSync(path.join(dir, STUDIO_MANAGED_FILENAME), 'utf8')
      expect(raw).toContain('GOTRUE_EXTERNAL_EMAIL_ENABLED=false')
      expect(raw).toContain('GOTRUE_JWT_EXP=7200')
      expect(raw).toContain('GOTRUE_SMTP_PORT=2500')
    })

    it('rejects unknown fields', async () => {
      await expect(
        store.updateConfig({ JWT_SECRET: 'nope' } as any, UPDATE_GOTRUE_CONFIG_FIELDS)
      ).rejects.toThrow(AuthConfigValidationError)
      await expect(
        store.updateConfig({ DB_DATABASE_URL: 'postgres://x' } as any, UPDATE_GOTRUE_CONFIG_FIELDS)
      ).rejects.toThrow('Unknown config fields')
    })

    it('rejects values of the wrong type', async () => {
      await expect(
        store.updateConfig({ EXTERNAL_EMAIL_ENABLED: 'false' } as any, UPDATE_GOTRUE_CONFIG_FIELDS)
      ).rejects.toThrow('Invalid value for EXTERNAL_EMAIL_ENABLED')
    })

    it('removes fields set to null', async () => {
      await store.updateConfig({ DISABLE_SIGNUP: true }, UPDATE_GOTRUE_CONFIG_FIELDS)
      await store.updateConfig({ DISABLE_SIGNUP: null }, UPDATE_GOTRUE_CONFIG_FIELDS)

      const raw = readFileSync(path.join(dir, STUDIO_MANAGED_FILENAME), 'utf8')
      expect(raw).not.toContain('GOTRUE_DISABLE_SIGNUP')
      await expect(store.getConfig()).resolves.toMatchObject({ DISABLE_SIGNUP: null })
    })

    it('studio-managed file wins over manually dropped files', async () => {
      write('00-manual.env', 'GOTRUE_DISABLE_SIGNUP=false\n')
      await store.updateConfig({ DISABLE_SIGNUP: true }, UPDATE_GOTRUE_CONFIG_FIELDS)
      await expect(store.getConfig()).resolves.toMatchObject({ DISABLE_SIGNUP: true })
    })

    it('creates the folder when missing', async () => {
      const missing = new FileSystemAuthConfigStore(path.join(dir, 'new-folder'))
      await missing.updateConfig({ DISABLE_SIGNUP: true }, UPDATE_GOTRUE_CONFIG_FIELDS)
      await expect(missing.getConfig()).resolves.toMatchObject({ DISABLE_SIGNUP: true })
    })
  })

  describe('resetTemplate', () => {
    it('removes only the content and subject of the given template', async () => {
      write(
        STUDIO_MANAGED_FILENAME,
        [
          'GOTRUE_MAILER_TEMPLATES_INVITE_CONTENT=<p>invite</p>',
          'GOTRUE_MAILER_SUBJECTS_INVITE=Join us',
          'GOTRUE_MAILER_TEMPLATES_RECOVERY_CONTENT=<p>recovery</p>',
        ].join('\n')
      )

      await store.resetTemplate('INVITE')

      const raw = readFileSync(path.join(dir, STUDIO_MANAGED_FILENAME), 'utf8')
      expect(raw).not.toContain('INVITE')
      expect(raw).toContain('GOTRUE_MAILER_TEMPLATES_RECOVERY_CONTENT=<p>recovery</p>')
    })
  })

  describe('parseGoDuration', () => {
    it.each([
      ['10s', 10],
      ['1h30m', 5400],
      ['1.5h', 5400],
      ['200ms', 0.2],
      ['0', 0],
    ])('parses %s as %s seconds', (input, expected) => {
      expect(parseGoDuration(input)).toBe(expected)
    })

    it.each(['abc', '10', '10x', ''])('returns null for invalid input %s', (input) => {
      expect(parseGoDuration(input)).toBeNull()
    })
  })

  describe('duration fields', () => {
    it('serializes seconds, hours and per-hour fields as Go durations', async () => {
      await store.updateConfig(
        {
          API_MAX_REQUEST_DURATION: 10,
          SESSIONS_TIMEBOX: 24,
          SESSIONS_INACTIVITY_TIMEOUT: 1.5,
          SMTP_MAX_FREQUENCY: 60,
        },
        WRITABLE_GOTRUE_CONFIG_FIELDS
      )

      const raw = readFileSync(path.join(dir, STUDIO_MANAGED_FILENAME), 'utf8')
      expect(raw).toContain('GOTRUE_API_MAX_REQUEST_DURATION=10s')
      expect(raw).toContain('GOTRUE_SESSIONS_TIMEBOX=24h')
      expect(raw).toContain('GOTRUE_SESSIONS_INACTIVITY_TIMEOUT=1.5h')
      expect(raw).toContain('GOTRUE_SMTP_MAX_FREQUENCY=60s')
    })

    it('converts Go durations back to UI units on read', async () => {
      write(
        '10-manual.env',
        [
          'GOTRUE_API_MAX_REQUEST_DURATION=15s',
          'GOTRUE_SESSIONS_TIMEBOX=1h30m',
          'GOTRUE_SMTP_MAX_FREQUENCY=2m0s',
        ].join('\n')
      )
      const config = await store.getConfig()
      expect(config.API_MAX_REQUEST_DURATION).toBe(15)
      expect(config.SESSIONS_TIMEBOX).toBe(1.5)
      expect(config.SMTP_MAX_FREQUENCY).toBe(30)
    })

    it('returns null for durations GoTrue cannot parse', async () => {
      write('10-manual.env', 'GOTRUE_SESSIONS_TIMEBOX=abc\n')
      await expect(store.getConfig()).resolves.toMatchObject({ SESSIONS_TIMEBOX: null })
    })

    it('rejects non-positive per-hour values', async () => {
      await expect(
        store.updateConfig({ SMTP_MAX_FREQUENCY: 0 }, WRITABLE_GOTRUE_CONFIG_FIELDS)
      ).rejects.toThrow(AuthConfigValidationError)
    })
  })

  describe('clearing fields', () => {
    it('accepts response-only PASSWORD_REQUIRED_CHARACTERS and clears it with an empty string', async () => {
      await store.updateConfig(
        { PASSWORD_REQUIRED_CHARACTERS: 'abcdefghijklmnopqrstuvwxyz' },
        WRITABLE_GOTRUE_CONFIG_FIELDS
      )
      let raw = readFileSync(path.join(dir, STUDIO_MANAGED_FILENAME), 'utf8')
      expect(raw).toContain('GOTRUE_PASSWORD_REQUIRED_CHARACTERS=abcdefghijklmnopqrstuvwxyz')

      await store.updateConfig({ PASSWORD_REQUIRED_CHARACTERS: '' }, WRITABLE_GOTRUE_CONFIG_FIELDS)
      raw = readFileSync(path.join(dir, STUDIO_MANAGED_FILENAME), 'utf8')
      expect(raw).not.toContain('GOTRUE_PASSWORD_REQUIRED_CHARACTERS')
    })

    it('removes keys set to an empty string instead of writing empty values', async () => {
      await store.updateConfig({ SMTP_PASS: 'secret' }, WRITABLE_GOTRUE_CONFIG_FIELDS)
      await store.updateConfig({ SMTP_PASS: '' }, WRITABLE_GOTRUE_CONFIG_FIELDS)

      const raw = readFileSync(path.join(dir, STUDIO_MANAGED_FILENAME), 'utf8')
      expect(raw).not.toContain('GOTRUE_SMTP_PASS')
      await expect(store.getConfig()).resolves.toMatchObject({ SMTP_PASS: null })
    })
  })
})
