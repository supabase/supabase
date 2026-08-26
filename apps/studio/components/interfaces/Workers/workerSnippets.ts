import { RUNTIMES, WORKERS_REGION, workerUrl } from './Workers.constants'
import type { WorkerAccess } from './Workers.types'
import { formatSize } from './Workers.utils'
import { CLI_NAME } from '@/lib/constants/workers'

export interface WorkerSnippetInput {
  name: string
  endpoint: string | undefined
  protocol?: string
  projectRef?: string
  runtime: string | undefined
  size: string
  access: WorkerAccess
  instances: number
}

const MANAGEMENT_API_URL = 'https://api.supabase.com'

export interface WorkerSnippets {
  aiPrompt: string
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
    // size comes from config.toml — push has no flag for it. Same for access: the CLI
    // doesn't have a route to a private worker yet, so this always deploys as public.
    `supabase ${CLI_NAME} push ${name} --instances ${input.instances}`,
    ...(input.access === 'private'
      ? [
          `# note: the CLI can only deploy public workers today — use the API (cURL tab) for private`,
        ]
      : []),
  ].join('\n')

  const configBlock = [
    `[${CLI_NAME}.${name}]`,
    `runtime   = "${runtime}"`,
    `size      = "${input.size}"    # ${formatSize(input.size)}`,
    `access    = "${input.access}"`,
    `instances = ${input.instances}`,
    `# region is locked to ${WORKERS_REGION} at alpha`,
  ].join('\n')

  const configToml = [`# supabase/config.toml`, ``, configBlock].join('\n')

  const runtimeMeta = RUNTIMES[runtime] ?? RUNTIMES.node
  // The entrypoint metadata is "<run command> <filename>" — the filename is the last token.
  const entrypointFile = runtimeMeta.entrypoint.split(' ').pop()

  const aiPrompt = [
    `Scaffold and deploy a Supabase Workers worker named "${name}" using the ${runtimeMeta.label} runtime:`,
    ``,
    `1. Create a supabase/${CLI_NAME}/${name}/ directory with a ${runtimeMeta.label} entrypoint (${entrypointFile}) that responds with "Hello, world!".`,
    ``,
    `2. Add this block to supabase/config.toml:`,
    '```toml',
    configBlock,
    '```',
    ``,
    `3. Run \`supabase ${CLI_NAME} push ${name}\` to deploy it.`,
    ...(input.access === 'private'
      ? [
          ``,
          `Note: the CLI can only deploy public workers today. If this worker needs to be private, deploy it via the management API instead (see the cURL tab).`,
        ]
      : []),
  ].join('\n')

  // Deploying is three calls against the management API — there's no single "create worker"
  // endpoint. Unlike the CLI, this talks to the API directly, so exposure isn't limited to public.
  const ref = input.projectRef ?? '[YOUR PROJECT REF]'
  const workersApiUrl = (path: string) =>
    `${MANAGEMENT_API_URL}/v2/projects/${ref}/workers/${name}${path}`
  const deploySpec =
    runtime === 'dockerfile'
      ? { size: input.size, exposure: input.access, instances: input.instances }
      : { runtime, size: input.size, exposure: input.access, instances: input.instances }

  const curl = [
    `# 1. Mint an upload slot for your build context`,
    `curl -X POST '${workersApiUrl('/uploads')}' \\`,
    `  -H 'Authorization: Bearer [YOUR ACCESS TOKEN]'`,
    `# -> copy the "url" from the response`,
    ``,
    `# 2. Upload the gzipped build context (no Supabase auth on this request)`,
    `curl -X PUT '[PRESIGNED UPLOAD URL]' --upload-file worker.tar.gz`,
    ``,
    `# 3. Deploy — this call creates the worker`,
    `curl -X POST '${workersApiUrl('/deploy')}' \\`,
    `  -H 'Authorization: Bearer [YOUR ACCESS TOKEN]' \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  --data '${JSON.stringify({
      data: {
        type: 'project_worker',
        attributes: { spec: deploySpec, context_upload_id: '[UPLOAD ID FROM STEP 1]' },
      },
    })}'`,
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

  return { aiPrompt, configToml, cli, curl, javascript, python }
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
