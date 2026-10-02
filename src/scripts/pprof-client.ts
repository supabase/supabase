import path from 'node:path'
import { parseArgs } from 'node:util'
import type {
  PprofArchivedProfile,
  PprofArchivedProfileList,
} from '@internal/monitoring/pprof/client-http'
import {
  downloadArchivedProfile,
  fetchArchivedProfiles,
  fetchPprofStream,
  triggerPprofCapture,
} from '@internal/monitoring/pprof/client-http'
import { writePprofCaptureToFile } from '@internal/monitoring/pprof/download'
import { generateFlameArtifacts, resolveFlameMdFormat } from '@internal/monitoring/pprof/flame'
import type { ProfileClass, ProfileKind } from '@internal/monitoring/pprof/store-key'

const USAGE = `Usage:
  npm run pprof -- capture <profile|heap> [--seconds N]
  npm run pprof -- capture heap-snapshot [--output FILE]
  npm run pprof -- list --class <auto|manual> [--kind <cpu|heap>] [--days-ago N | --date YYYY-MM-DD | --all-dates] [--limit N] [--cursor TOKEN] [--all-pages] [--download DIRECTORY] [--flame]`

type PprofCommand =
  | {
      name: 'capture'
      target: 'profile' | 'heap'
      seconds: number
    }
  | {
      name: 'capture'
      target: 'heap-snapshot'
      output?: string
    }
  | {
      name: 'list'
      class: ProfileClass
      kind?: ProfileKind
      date?: string
      limit?: number
      cursor?: string
      allPages: boolean
      downloadDirectory?: string
      generateFlame: boolean
    }

function parsePositiveInteger(value: string | undefined, name: string, maximum?: number) {
  if (!value || !/^\d+$/.test(value)) throw new Error(`${name} must be a positive integer`)
  const parsed = Number.parseInt(value, 10)
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || (maximum !== undefined && parsed > maximum)) {
    throw new Error(
      `${name} must be a positive integer${maximum ? ` no greater than ${maximum}` : ''}`
    )
  }
  return parsed
}

function parseNonNegativeInteger(value: string, name: string) {
  if (!/^\d+$/.test(value)) throw new Error(`${name} must be a non-negative integer`)
  const parsed = Number.parseInt(value, 10)
  if (!Number.isSafeInteger(parsed)) throw new Error(`${name} must be a non-negative integer`)
  return parsed
}

function parseNonEmptyString(value: string | undefined, name: string) {
  if (!value?.trim()) throw new Error(`${name} must not be empty`)
  return value
}

function parseProfileDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('date must use YYYY-MM-DD')
  const timestamp = Date.parse(`${value}T00:00:00.000Z`)
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) {
    throw new Error('date must use YYYY-MM-DD')
  }
  return value
}

function utcDateDaysAgo(now: Date, daysAgo: number) {
  const date = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysAgo)
  )
  if (Number.isNaN(date.getTime())) throw new Error('days-ago is outside the supported date range')
  const formatted = date.toISOString().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(formatted)) {
    throw new Error('days-ago is outside the supported date range')
  }
  return formatted
}

export function parsePprofCommand(args: string[], now = new Date()): PprofCommand {
  const [name, ...rest] = args

  if (name === 'capture') {
    const [target, ...captureArgs] = rest
    if (target !== 'profile' && target !== 'heap' && target !== 'heap-snapshot') {
      throw new Error(USAGE)
    }

    if (target === 'heap-snapshot') {
      const { values, positionals } = parseArgs({
        args: captureArgs,
        allowPositionals: true,
        strict: true,
        options: { output: { type: 'string' } },
      })
      if (positionals.length > 0) throw new Error(USAGE)
      return { name, target, output: values.output }
    }

    const { values, positionals } = parseArgs({
      args: captureArgs,
      allowPositionals: true,
      strict: true,
      options: { seconds: { type: 'string' } },
    })
    if (positionals.length > 0) throw new Error(USAGE)
    return {
      name,
      target,
      seconds:
        values.seconds === undefined ? 30 : parsePositiveInteger(values.seconds, 'seconds', 300),
    }
  }

  if (name === 'list') {
    const { values, positionals } = parseArgs({
      args: rest,
      allowPositionals: true,
      strict: true,
      options: {
        class: { type: 'string' },
        kind: { type: 'string' },
        'days-ago': { type: 'string' },
        date: { type: 'string' },
        'all-dates': { type: 'boolean' },
        'all-pages': { type: 'boolean' },
        download: { type: 'string' },
        flame: { type: 'boolean' },
        limit: { type: 'string' },
        cursor: { type: 'string' },
      },
    })
    if (positionals.length > 0 || (values.class !== 'auto' && values.class !== 'manual')) {
      throw new Error('--class must be auto or manual')
    }
    if (values.kind !== undefined && values.kind !== 'cpu' && values.kind !== 'heap') {
      throw new Error('--kind must be cpu or heap')
    }
    const dateSelectors = [values['days-ago'], values.date, values['all-dates'] === true].filter(
      (value) => value !== undefined && value !== false
    )
    if (dateSelectors.length > 1)
      throw new Error('--days-ago, --date and --all-dates are mutually exclusive')
    const daysAgo =
      values['days-ago'] === undefined ? 0 : parseNonNegativeInteger(values['days-ago'], 'days-ago')
    if (values.flame === true && values.download === undefined) {
      throw new Error('--flame requires --download')
    }
    return {
      name,
      class: values.class,
      kind: values.kind,
      date:
        values['all-dates'] === true
          ? undefined
          : values.date === undefined
            ? utcDateDaysAgo(now, daysAgo)
            : parseProfileDate(values.date),
      limit:
        values.limit === undefined ? undefined : parsePositiveInteger(values.limit, 'limit', 1000),
      cursor: values.cursor,
      allPages: values['all-pages'] === true,
      downloadDirectory:
        values.download === undefined
          ? undefined
          : parseNonEmptyString(values.download, 'download directory'),
      generateFlame: values.flame === true,
    }
  }

  throw new Error(USAGE)
}

async function generateFlame(profilePath: string, enabled: boolean) {
  if (!enabled) return
  await generateFlameArtifacts(profilePath, {
    env: {
      ...process.env,
      FLAME_SOURCEMAPS_DIRS: process.env.FLAME_SOURCEMAPS_DIRS || 'dist',
    },
    mdFormat: resolveFlameMdFormat(process.env.PPROF_FLAME_MD_FORMAT),
  })
}

function bulkDownloadFilename(profile: PprofArchivedProfile) {
  const key = profile.key.match(/^v1\/(auto|manual)\/\d{13}-([a-f0-9]{12})\/(cpu|heap)\//)
  const startedAt = new Date(profile.startedAt)
  const metadata = [profile.reason, profile.build, profile.hostname]
  if (
    !key ||
    Number.isNaN(startedAt.getTime()) ||
    metadata.some((value) => !/^[a-z0-9][a-z0-9.-]{0,63}$/.test(value))
  ) {
    throw new Error(`Invalid profile returned by list: ${profile.key}`)
  }
  const timestamp = startedAt.toISOString().replace(/[:.]/g, '-')
  return `${key[1]}-${key[3]}-${timestamp}-${metadata.join('-')}-${key[2]}.pprof.gz`
}

async function fetchProfilePages(
  command: Extract<PprofCommand, { name: 'list' }>,
  adminUrl: string,
  apiKey: string
) {
  const profiles: PprofArchivedProfile[] = []
  const seenCursors = new Set<string>()
  let cursor = command.cursor
  if (cursor) seenCursors.add(cursor)

  while (true) {
    const page = await fetchArchivedProfiles({
      adminUrl,
      apiKey,
      class: command.class,
      kind: command.kind,
      date: command.date,
      limit: command.limit,
      cursor,
    })
    profiles.push(...page.profiles)

    if (!command.allPages || page.cursor === undefined) {
      return {
        profiles,
        cursor: page.cursor,
      } satisfies PprofArchivedProfileList
    }
    if (seenCursors.has(page.cursor)) {
      throw new Error('Pprof list returned a repeated cursor')
    }
    seenCursors.add(page.cursor)
    cursor = page.cursor
  }
}

async function downloadProfiles(
  profiles: PprofArchivedProfile[],
  directory: string,
  adminUrl: string,
  apiKey: string,
  generateFlameFiles: boolean
) {
  for (const profile of profiles) {
    const response = await downloadArchivedProfile({ adminUrl, apiKey, key: profile.key })
    const { outputPath } = await writePprofCaptureToFile(
      response.stream,
      {
        contentDisposition: response.contentDisposition,
        type: 'profile',
      },
      {
        outputPath: path.join(directory, bulkDownloadFilename(profile)),
      }
    )
    await generateFlame(outputPath, generateFlameFiles)
  }
}

export async function executePprofCommand(command: PprofCommand, adminUrl: string, apiKey: string) {
  if (command.name === 'list') {
    const result = await fetchProfilePages(command, adminUrl, apiKey)
    console.log(JSON.stringify(result, null, 2))
    if (command.downloadDirectory) {
      await downloadProfiles(
        result.profiles,
        command.downloadDirectory,
        adminUrl,
        apiKey,
        command.generateFlame
      )
    }
    return result
  }

  if (command.target !== 'heap-snapshot') {
    console.log(
      JSON.stringify(
        await triggerPprofCapture({
          adminUrl,
          apiKey,
          type: command.target === 'profile' ? 'cpu' : 'heap',
          seconds: command.seconds,
        }),
        null,
        2
      )
    )
    return
  }

  const response = await fetchPprofStream({
    adminUrl,
    apiKey,
    type: command.target,
  })
  await writePprofCaptureToFile(
    response.stream,
    {
      contentDisposition: response.contentDisposition,
      type: command.target,
    },
    { outputPath: command.output }
  )
}

async function main() {
  const adminUrl = process.env.ADMIN_URL
  const apiKey = process.env.ADMIN_API_KEY
  if (!adminUrl) throw new Error('Please provide ADMIN_URL')
  if (!apiKey) throw new Error('Please provide ADMIN_API_KEY')
  await executePprofCommand(parsePprofCommand(process.argv.slice(2)), adminUrl, apiKey)
}

if (require.main === module) {
  main().catch((error) => {
    process.exitCode = 1
    console.error(error instanceof Error ? error.message : error)
  })
}
