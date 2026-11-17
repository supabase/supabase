import { COMPUTE_REGION, computeInstanceUrl, LISTENING_PORT, RUNTIMES } from './Compute.constants'
import type { ComputeInstanceAccess } from './Compute.types'
import { formatSize } from './Compute.utils'
import { CLI_NAME } from '@/lib/constants/compute'

export interface ComputeInstanceSnippetInput {
  name: string
  endpoint: string | undefined
  protocol?: string
  runtime: string | undefined
  size: string
  access: ComputeInstanceAccess
  instances: number
}

export interface ComputeInstanceSnippets {
  aiPrompt: string
  configToml: string
  cli: string
  curl: string
  javascript: string
  python: string
}

export const EXAMPLE_COMPUTE_INSTANCE: Omit<ComputeInstanceSnippetInput, 'endpoint' | 'protocol'> =
  {
    name: 'my-instance',
    runtime: 'node',
    size: '2gb-1vcpu',
    access: 'public',
    instances: 1,
  }

const safeName = (name: string) => (name.trim().length > 0 ? name.trim() : 'my-instance')

export function buildComputeInstanceSnippets(
  input: ComputeInstanceSnippetInput
): ComputeInstanceSnippets {
  const name = safeName(input.name)
  const runtime = input.runtime ?? 'node'

  const url =
    computeInstanceUrl({ endpoint: input.endpoint, protocol: input.protocol, name }) ??
    '[YOUR INSTANCE URL]'

  // config.toml takes the memory-only size ("2gb"); the CLI maps it to the API's "2gb-1vcpu".
  const cliSize = input.size.split('-')[0]

  const cli = [
    `export SUPABASE_EXPERIMENTAL_COMPUTE=1`,
    `supabase ${CLI_NAME} new ${name} --runtime ${runtime} --size ${cliSize} --exposure ${input.access} --instances ${input.instances}`,
    `supabase ${CLI_NAME} push ${name}`,
  ].join('\n')

  const curl = [
    `curl --request POST '${url}' \\`,
    `  --header 'Content-Type: application/json' \\`,
    `  --data '{"name":"world"}'`,
  ].join('\n')

  const configBlock = [
    `[${CLI_NAME}.${name}]`,
    `runtime   = "${runtime}"`,
    `size      = "${cliSize}"    # ${formatSize(input.size)}`,
    `exposure  = "${input.access}"`,
    `instances = ${input.instances}`,
    `# region is locked to ${COMPUTE_REGION} at alpha`,
  ].join('\n')

  const configToml = [
    `# supabase/config.toml`,
    `# Compute is experimental: also set compute = true under [experimental]`,
    ``,
    configBlock,
  ].join('\n')

  const runtimeMeta = RUNTIMES[runtime] ?? RUNTIMES.node
  // The entrypoint metadata is "<run command> <filename>" — the filename is the last token.
  const entrypointFile = runtimeMeta.entrypoint.split(' ').pop()
  const source =
    runtime === 'dockerfile'
      ? 'a Dockerfile'
      : `a ${runtimeMeta.label} entrypoint (${entrypointFile})`
  const behavior =
    input.access === 'public'
      ? `serves plain HTTP on the port in $PORT (defaults to ${LISTENING_PORT}) and responds with "Hello, world!". Public instances do not verify API keys, so add your own auth if the endpoint needs it.`
      : `runs a background worker that never exits, e.g. a loop that polls a pgmq queue and processes each message. Private instances have no inbound network access, so do not start an HTTP server.`

  const aiPrompt = [
    `Scaffold and deploy a Supabase Compute instance named "${name}" using the ${runtimeMeta.label} runtime:`,
    ``,
    `1. Create a supabase/${CLI_NAME}/${name}/ directory with ${source} that ${behavior}`,
    ``,
    `2. Add this block to supabase/config.toml, and set \`compute = true\` under the \`[experimental]\` table (add the table if it is missing) — the CLI hides the compute commands without it:`,
    '```toml',
    configBlock,
    '```',
    ``,
    `3. Make sure the CLI is logged in (\`supabase login\`) and the project is initialized (\`supabase init\`) and linked (\`supabase link\`).`,
    ``,
    `4. Ask me to confirm the deploy, then run \`supabase ${CLI_NAME} push ${name} --yes\`. Without \`--yes\` the command waits for interactive confirmation.`,
  ].join('\n')

  const javascript = [
    `const res = await fetch('${url}', {`,
    `  method: 'POST',`,
    `  headers: { 'Content-Type': 'application/json' },`,
    `  body: JSON.stringify({ name: 'world' }),`,
    `})`,
    `const data = await res.json()`,
  ].join('\n')

  const python = [
    `import requests`,
    ``,
    `res = requests.post(`,
    `    "${url}",`,
    `    json={"name": "world"},`,
    `)`,
    `print(res.json())`,
  ].join('\n')

  return { aiPrompt, configToml, cli, curl, javascript, python }
}

export interface ComputeInstanceCliCommand {
  comment: string
  command: string
}

// `supabase compute logs` is deprecated in favour of the unified logs command.
// --since matches the logs tab's default range; the CLI defaults to 1h.
export const computeLogsCommand = (name: string, kind?: 'app' | 'requests' | 'builds') =>
  `supabase logs --remote --service ${CLI_NAME} --resource ${safeName(name)} --since 24h${kind ? ` --kind ${kind}` : ''}`

export function buildComputeInstanceCliCommands(name: string): ComputeInstanceCliCommand[] {
  const slug = safeName(name)
  return [
    { comment: 'Deploy a new version', command: `supabase ${CLI_NAME} push ${slug}` },
    { comment: 'View logs', command: computeLogsCommand(slug) },
    { comment: 'Delete the instance', command: `supabase ${CLI_NAME} delete ${slug}` },
  ]
}
