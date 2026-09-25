import {
  COMPUTE_AGENT_GUIDE_URL,
  COMPUTE_REGION,
  COMPUTE_SKILL_NAME,
  computeInstanceUrl,
  LISTENING_PORT,
  RUNTIMES,
} from './Compute.constants'
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
  skill: string
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

  const deployedSummary =
    input.access === 'public'
      ? [
          `Once the deploy finishes, the instance answers at ${url}:`,
          ``,
          '```bash',
          `curl ${url}`,
          '```',
        ]
      : [
          `A private instance has no URL. It starts from its entrypoint, runs its own loop, and reaches out — nothing can call it.`,
        ]

  const skill = [
    `---`,
    `name: ${COMPUTE_SKILL_NAME}`,
    `description: Deploy and operate Supabase Compute instances with the Supabase CLI.`,
    `---`,
    ``,
    `# Supabase Compute`,
    ``,
    `Compute runs a directory of code as a named service next to the project's database. It is in private alpha: the CLI ships it in the beta channel, behind an experimental flag.`,
    ``,
    `Full guide, including Deno and Dockerfile examples: ${COMPUTE_AGENT_GUIDE_URL}`,
    ``,
    `## Set up the CLI`,
    ``,
    '```bash',
    `npm install -g supabase@beta`,
    `supabase login   # or set SUPABASE_ACCESS_TOKEN to an sbp_... personal access token`,
    '```',
    ``,
    `Turn ${CLI_NAME} on in \`supabase/config.toml\`:`,
    ``,
    '```toml',
    `[experimental]`,
    `${CLI_NAME} = true`,
    '```',
    ``,
    `## Deploy ${name}`,
    ``,
    `Declare the instance in \`supabase/config.toml\`:`,
    ``,
    '```toml',
    configBlock,
    '```',
    ``,
    `Scaffold the ${runtimeMeta.label} entrypoint (\`supabase/${CLI_NAME}/${name}/${entrypointFile}\`), then deploy:`,
    ``,
    '```bash',
    cli,
    '```',
    ``,
    ...deployedSummary,
    ``,
    `## Rules`,
    ``,
    `- Every change is another \`supabase ${CLI_NAME} push ${name}\`. Scale with \`--instances\`; resize or change exposure by editing the TOML block and pushing again.`,
    `- Instances are stateless and can be replaced at any time. Durable state belongs in the database or in storage.`,
    `- A public instance must accept connections on \`$PORT\` (default ${LISTENING_PORT}) within 50 seconds of starting. Bind the port first, then load heavy dependencies.`,
    `- Size is fixed at deploy time. A process that outgrows its memory is killed and its instance replaced.`,
    `- Secrets reach instances as environment variables: \`supabase secrets set KEY=value\`. Running instances pick up changes within about a minute.`,
    `- Deploys are locked to ${COMPUTE_REGION} during the alpha.`,
    `- Diagnose failures from the CLI instead of guessing: \`supabase ${CLI_NAME} status ${name}\` carries \`state_reason\`, \`supabase ${CLI_NAME} logs ${name} --kind builds\` the build history, and \`supabase ${CLI_NAME} logs ${name} --follow\` the live output.`,
  ].join('\n')

  return { aiPrompt, skill, configToml, cli, curl, javascript, python }
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
