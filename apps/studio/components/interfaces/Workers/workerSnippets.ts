import { getRuntimeMeta, getSizeMeta, workerGatewayUrl } from './Workers.constants'
import type { WorkerAccess, WorkerRuntime, WorkerSize } from './Workers.types'
import { CLI_NAME, PRODUCT_NAME } from '@/lib/constants/workers'

export interface WorkerSnippetInput {
  name: string
  runtime: WorkerRuntime
  size: WorkerSize
  access: WorkerAccess
  instances: number
}

export interface WorkerSnippets {
  /** Natural-language prompt a user can paste into an agent. */
  aiPrompt: string
  /** `supabase/config.toml` block the CLI reads. */
  configToml: string
  /** `supabase workers deploy` invocation. */
  cli: string
  /** `curl` invocation against the deployed worker. */
  curl: string
  /** JavaScript (fetch) invocation. */
  javascript: string
  /** Python (requests) invocation. */
  python: string
}

const safeName = (name: string) => (name.trim().length > 0 ? name.trim() : 'my-worker')

export function buildWorkerSnippets(input: WorkerSnippetInput): WorkerSnippets {
  const name = safeName(input.name)
  const runtime = getRuntimeMeta(input.runtime)
  const size = getSizeMeta(input.size)

  const cli = [
    `supabase ${CLI_NAME} new ${name} --runtime ${runtime.cli}`,
    `supabase ${CLI_NAME} push ${name}`,
  ].join('\n')

  const configToml = [
    `# supabase/config.toml`,
    ``,
    `[${CLI_NAME}.${name}]`,
    `runtime   = "${runtime.cli}"`,
    `size      = "${input.size}"        # ${size.memory} / ${size.vcpu}`,
    `access    = "${input.access}"`,
    `instances = ${input.instances}`,
    `# region is locked to us-west-1 at alpha`,
  ].join('\n')

  const authHeader =
    input.access === 'public'
      ? `  -H 'Authorization: Bearer [YOUR ANON KEY]' \\`
      : `  -H 'Authorization: Bearer [YOUR SERVICE ROLE KEY]' \\`

  const curl = [
    `curl -L -X POST '${workerGatewayUrl(name)}' \\`,
    authHeader,
    `  -H 'Content-Type: application/json' \\`,
    `  --data '{"name":"world"}'`,
  ].join('\n')

  const keyPlaceholder = input.access === 'public' ? '[YOUR ANON KEY]' : '[YOUR SERVICE ROLE KEY]'
  const url = workerGatewayUrl(name)

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

  const aiPrompt = [
    `Deploy a Supabase ${PRODUCT_NAME} worker named "${name}".`,
    `Use the ${runtime.label} runtime on a ${input.size} instance (${size.memory} / ${size.vcpu}),`,
    `${input.access} access, ${input.instances} instance${input.instances === 1 ? '' : 's'}.`,
    `Write the config to supabase/config.toml and run \`supabase ${CLI_NAME} push ${name}\`.`,
  ].join(' ')

  return { aiPrompt, configToml, cli, curl, javascript, python }
}

export interface WorkerCliCommand {
  comment: string
  command: string
}

/** The "Develop locally" CLI commands for a worker (pull / push / logs / delete). */
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
