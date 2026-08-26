import { WORKERS_REGION, workerUrl } from './Workers.constants'
import type { WorkerAccess } from './Workers.types'
import { formatSize } from './Workers.utils'
import { CLI_NAME } from '@/lib/constants/workers'

export interface WorkerSnippetInput {
  name: string
  endpoint: string | undefined
  protocol?: string
  runtime: string | undefined
  size: string
  access: WorkerAccess
  instances: number
}

export interface WorkerSnippets {
  configToml: string
  cli: string
  curl: string
  javascript: string
  python: string
}

export const EXAMPLE_WORKER: Omit<WorkerSnippetInput, 'endpoint' | 'protocol'> = {
  name: 'my-worker',
  runtime: 'node',
  size: '2gb-1vcpu',
  access: 'public',
  instances: 1,
}

const safeName = (name: string) => (name.trim().length > 0 ? name.trim() : 'my-worker')

export function buildWorkerSnippets(input: WorkerSnippetInput): WorkerSnippets {
  const name = safeName(input.name)
  const runtime = input.runtime ?? 'node'

  const url =
    workerUrl({ endpoint: input.endpoint, protocol: input.protocol, name }) ?? '[YOUR WORKER URL]'

  const cli = [
    `supabase ${CLI_NAME} new ${name} --runtime ${runtime}`,
    `supabase ${CLI_NAME} push ${name}`,
  ].join('\n')

  const configToml = [
    `# supabase/config.toml`,
    ``,
    `[${CLI_NAME}.${name}]`,
    `runtime   = "${runtime}"`,
    `size      = "${input.size}"    # ${formatSize(input.size)}`,
    `access    = "${input.access}"`,
    `instances = ${input.instances}`,
    `# region is locked to ${WORKERS_REGION} at alpha`,
  ].join('\n')

  const authHeader =
    input.access === 'public'
      ? `  -H 'Authorization: Bearer [YOUR ANON KEY]' \\`
      : `  -H 'Authorization: Bearer [YOUR SERVICE ROLE KEY]' \\`

  const curl = [
    `curl -L -X POST '${url}' \\`,
    authHeader,
    `  -H 'Content-Type: application/json' \\`,
    `  --data '{"name":"world"}'`,
  ].join('\n')

  const keyPlaceholder = input.access === 'public' ? '[YOUR ANON KEY]' : '[YOUR SERVICE ROLE KEY]'

  const javascript = [
    `const res = await fetch('${url}', {`,
    `  method: 'POST',`,
    `  headers: {`,
    `    Authorization: 'Bearer ${keyPlaceholder}',`,
    `    'Content-Type': 'application/json',`,
    `  },`,
    `  body: JSON.stringify({ name: 'world' }),`,
    `})`,
    `const data = await res.json()`,
  ].join('\n')

  const python = [
    `import requests`,
    ``,
    `res = requests.post(`,
    `    "${url}",`,
    `    headers={"Authorization": "Bearer ${keyPlaceholder}"},`,
    `    json={"name": "world"},`,
    `)`,
    `print(res.json())`,
  ].join('\n')

  return { configToml, cli, curl, javascript, python }
}

export interface WorkerCliCommand {
  comment: string
  command: string
}

export function buildWorkerCliCommands(name: string): WorkerCliCommand[] {
  const slug = safeName(name)
  return [
    { comment: 'Recreate the source locally', command: `supabase ${CLI_NAME} pull ${slug}` },
    { comment: 'Run it locally on a port', command: `supabase ${CLI_NAME} serve ${slug}` },
    { comment: 'Deploy a new version', command: `supabase ${CLI_NAME} push ${slug}` },
    { comment: 'Stream logs', command: `supabase ${CLI_NAME} logs ${slug} --follow` },
    { comment: 'Delete the worker', command: `supabase ${CLI_NAME} delete ${slug}` },
  ]
}
