import { getRuntimeMeta, getSizeMeta, workerGatewayUrl } from './Workers.constants'
import type { WorkerAccess, WorkerRuntime, WorkerSize } from './Workers.types'

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
}

const safeName = (name: string) => (name.trim().length > 0 ? name.trim() : 'my-worker')

export function buildWorkerSnippets(input: WorkerSnippetInput): WorkerSnippets {
  const name = safeName(input.name)
  const runtime = getRuntimeMeta(input.runtime)
  const size = getSizeMeta(input.size)

  const cli = [
    `supabase workers deploy ${name} \\`,
    `  --runtime ${runtime.cli} \\`,
    `  --size ${input.size} \\`,
    `  --access ${input.access} \\`,
    `  --instances ${input.instances}`,
  ].join('\n')

  const configToml = [
    `# supabase/config.toml`,
    ``,
    `[workers.${name}]`,
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

  const aiPrompt = [
    `Deploy a Supabase Worker named "${name}".`,
    `Use the ${runtime.label} runtime on a ${input.size} instance (${size.memory} / ${size.vcpu}),`,
    `${input.access} access, ${input.instances} instance${input.instances === 1 ? '' : 's'}.`,
    `Write the config to supabase/config.toml and run \`supabase workers deploy ${name}\`.`,
  ].join(' ')

  return { aiPrompt, configToml, cli, curl }
}
