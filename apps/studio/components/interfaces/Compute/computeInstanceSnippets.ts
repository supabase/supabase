import { COMPUTE_REGION, computeInstanceUrl, RUNTIMES } from './Compute.constants'
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

  const cli = [
    `supabase ${CLI_NAME} new ${name} --runtime ${runtime}`,
    `supabase ${CLI_NAME} push ${name} --instances ${input.instances} --exposure ${input.access}`,
  ].join('\n')

  const curl = [
    `curl --request POST '${url}' \\`,
    `  --header 'Content-Type: application/json' \\`,
    `  --data '{"name":"world"}'`,
  ].join('\n')

  const configBlock = [
    `[${CLI_NAME}.${name}]`,
    `runtime   = "${runtime}"`,
    `size      = "${input.size}"    # ${formatSize(input.size)}`,
    `exposure  = "${input.access}"`,
    `instances = ${input.instances}`,
    `# region is locked to ${COMPUTE_REGION} at alpha`,
  ].join('\n')

  const configToml = [`# supabase/config.toml`, ``, configBlock].join('\n')

  const runtimeMeta = RUNTIMES[runtime] ?? RUNTIMES.node
  // The entrypoint metadata is "<run command> <filename>" — the filename is the last token.
  const entrypointFile = runtimeMeta.entrypoint.split(' ').pop()

  const aiPrompt = [
    `Scaffold and deploy a Supabase Compute instance named "${name}" using the ${runtimeMeta.label} runtime:`,
    ``,
    `1. Create a supabase/${CLI_NAME}/${name}/ directory with a ${runtimeMeta.label} entrypoint (${entrypointFile}) that responds with "Hello, world!".`,
    ``,
    `2. Add this block to supabase/config.toml:`,
    '```toml',
    configBlock,
    '```',
    ``,
    `3. Run \`supabase ${CLI_NAME} push ${name} --exposure ${input.access}\` to deploy it.`,
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

export interface ComputeInstanceCliCommand {
  comment: string
  command: string
}

export function buildComputeInstanceCliCommands(name: string): ComputeInstanceCliCommand[] {
  const slug = safeName(name)
  return [
    { comment: 'Recreate the source locally', command: `supabase ${CLI_NAME} pull ${slug}` },
    { comment: 'Deploy a new version', command: `supabase ${CLI_NAME} push ${slug}` },
    { comment: 'Stream logs', command: `supabase ${CLI_NAME} logs ${slug} --follow` },
    { comment: 'Delete the instance', command: `supabase ${CLI_NAME} delete ${slug}` },
  ]
}
