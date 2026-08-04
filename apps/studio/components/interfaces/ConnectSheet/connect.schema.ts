import { FEATURE_GROUPS_NON_PLATFORM, FEATURE_GROUPS_PLATFORM } from 'ui-patterns/McpUrlBuilder'

import type { ConnectSchema, StepDefinition } from './Connect.types'

/**
 * MCP feature groups enabled by default on platform (Storage is excluded to keep
 * tool counts manageable).
 */
export const DEFAULT_MCP_FEATURES = FEATURE_GROUPS_PLATFORM.filter(
  (group) => group.id !== 'storage'
).map((group) => group.id)

const NON_PLATFORM_MCP_FEATURE_IDS = new Set(FEATURE_GROUPS_NON_PLATFORM.map((group) => group.id))

/** Defaults (and supported IDs) for the current deployment mode. */
export function getDefaultMcpFeatures(isPlatform: boolean): string[] {
  if (isPlatform) return DEFAULT_MCP_FEATURES
  return DEFAULT_MCP_FEATURES.filter((id) => NON_PLATFORM_MCP_FEATURE_IDS.has(id))
}

export function getSupportedMcpFeatureGroups(isPlatform: boolean) {
  return isPlatform ? FEATURE_GROUPS_PLATFORM : FEATURE_GROUPS_NON_PLATFORM
}

export function normalizeMcpFeatures(features: string[], isPlatform: boolean): string[] {
  if (isPlatform) return features
  return features.filter((id) => NON_PLATFORM_MCP_FEATURE_IDS.has(id))
}

/**
 * Base install commands for each library.
 */
export const INSTALL_COMMANDS: Record<string, string> = {
  supabasejs: 'npm install @supabase/supabase-js',
  supabasepy: 'pip install supabase',
  supabaseflutter: 'flutter pub add supabase_flutter',
  supabaseswift:
    'swift package add-dependency https://github.com/supabase-community/supabase-swift',
  supabasekt: 'implementation("io.github.jan-tennert.supabase:supabase-kt:VERSION")',
}

/**
 * Extra packages required by specific frameworks on top of the base library.
 * Keyed by library, then by framework (or framework/variant for more specificity).
 * The install step checks the most specific key first (e.g. "nextjs/app"),
 * then falls back to the framework key (e.g. "nextjs").
 */
export const EXTRA_PACKAGES: Record<string, Record<string, string[]>> = {
  supabasejs: {
    'nextjs/app': ['@supabase/ssr'],
    remix: ['@supabase/ssr'],
  },
}

// ============================================================================
// Step Definitions (reusable)
// All content paths use template syntax: {{stateKey}} is replaced with state values
// ============================================================================

const frameworkInstallStep: StepDefinition = {
  id: 'install',
  title: 'Install package',
  description: 'Run this command to install the required dependencies.',
  content: 'steps/install',
}

const frameworkInstallPackagesStep: StepDefinition = {
  id: 'install',
  title: 'Install packages',
  description: 'Run this command to install the required dependencies.',
  content: 'steps/install',
}

const frameworkConfigureStep: StepDefinition = {
  id: 'configure',
  title: 'Add files',
  description: 'Copy the following code into your project.',
  content: '{{framework}}/{{frameworkVariant}}/{{library}}',
}

const frameworkNextJsFilesStep: StepDefinition = {
  id: 'configure-nextjs',
  title: 'Add files',
  description:
    'Add env variables, create Supabase client helpers, and set up middleware to keep sessions refreshed.',
  content: '{{framework}}/{{frameworkVariant}}/{{library}}',
}

const frameworkReactFilesStep: StepDefinition = {
  id: 'configure-react',
  title: 'Add files',
  description: 'Add env variables, create a Supabase client, and use it in your app to query data.',
  content: '{{framework}}/{{frameworkVariant}}/{{library}}',
}

const frameworkShadcnStep: StepDefinition = {
  id: 'shadcn-add',
  title: 'Add Supabase UI components',
  description: 'Install Supabase UI components via the shadcn registry.',
  content: 'steps/shadcn/command',
}

const frameworkShadcnEnvStep: StepDefinition = {
  id: 'shadcn-env',
  title: 'Set env variables',
  description: 'Add the following values to your env file.',
  content: 'steps/shadcn/env',
}

const directConnectionStep: StepDefinition = {
  id: 'connection',
  title: 'Connection string',
  description: 'Copy the connection details for your database.',
  content: 'steps/direct-connection',
}

const directInstallStep: StepDefinition = {
  id: 'direct-install',
  title: 'Install dependencies',
  description: 'Install the required dependencies.',
  content: 'steps/direct-install',
}

const directFilesStep: StepDefinition = {
  id: 'direct-files',
  title: 'Add files',
  description: 'Add the following files to your project.',
  content: 'steps/direct-files',
}

const mcpConfigureStep: StepDefinition = {
  id: 'configure-mcp',
  title: 'Configure MCP',
  description: 'Set up your MCP client.',
  content: 'steps/mcp/cursor',
}

// Codex-specific MCP steps
const codexAddServerStep: StepDefinition = {
  id: 'codex-add-server',
  title: 'Add the Supabase MCP server to Codex',
  description: 'Run this command to add the server.',
  content: 'steps/mcp/codex/add-server',
}

const codexAuthenticateStep: StepDefinition = {
  id: 'codex-authenticate',
  title: 'Authenticate',
  description: 'Run the authentication command.',
  content: 'steps/mcp/codex/authenticate',
}

const codexVerifyStep: StepDefinition = {
  id: 'codex-verify',
  title: 'Verify authentication',
  description: 'Confirm the MCP server is authenticated.',
  content: 'steps/mcp/codex/verify',
}

const claudeAddServerStep: StepDefinition = {
  id: 'claude-add-server',
  title: 'Add MCP server',
  description: 'Add the MCP server to your project config using the command line.',
  content: 'steps/mcp/claude-code/add-server',
}

const claudeAuthenticateStep: StepDefinition = {
  id: 'claude-authenticate',
  title: 'Authenticate',
  description:
    'After configuring the MCP server, you need to authenticate. Run this in a regular terminal, not an IDE extension.',
  content: 'steps/mcp/claude-code/authenticate',
}

const ormInstallStep: StepDefinition = {
  id: 'install',
  title: 'Install ORM',
  description: 'Add the ORM to your project.',
  content: 'steps/orm-install',
}

const ormConfigureStep: StepDefinition = {
  id: 'configure',
  title: 'Configure ORM',
  description: 'Set up your ORM configuration.',
  content: '{{orm}}',
}

const serverInstallStep: StepDefinition = {
  id: 'server-install',
  title: 'Install package',
  description: 'Add @supabase/server to your backend.',
  content: 'server/install',
}

const serverEnvStep: StepDefinition = {
  id: 'server-env',
  title: 'Set environment variables',
  description:
    'Copy these into your environment so your handler can verify users and use supabase-js.',
  content: 'server/env',
}

const skillsInstallStep: StepDefinition = {
  id: 'install-skills',
  title: 'Install Agent Skills',
  optional: true,
  description:
    'Agent Skills give AI coding tools ready-made instructions, scripts, and resources for working with Supabase more accurately and efficiently.',
  content: 'steps/skills-install',
}

const serverSkillsInstallStep: StepDefinition = {
  id: 'install-skills',
  title: 'Install the Supabase Server skill',
  optional: true,
  description: 'Give AI coding tools instructions for building APIs with @supabase/server.',
  content: 'steps/skills-install',
}

// ============================================================================
// Mode Prompts
// ============================================================================

// Agent-ready prompt for the Server mode. Intentionally omits the project's
// actual keys — the secret should never be pasted into an LLM prompt; users
// copy the real values from the env step.
const serverConnectPrompt = `Set up the @supabase/server SDK in this project.

Install it:
npm install @supabase/server

It reads these environment variables (copy the real values from the Supabase dashboard's Connect dialog — never commit the secret key):
- SUPABASE_URL
- SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SECRET_KEY
- SUPABASE_JWKS_URL (used to verify user JWTs)

Create request handlers with \`withSupabase\` from "@supabase/server". It validates auth and provides an RLS-scoped client (\`ctx.supabase\`) and an admin client that bypasses RLS (\`ctx.supabaseAdmin\`). Example:

import { withSupabase } from "@supabase/server"

export default {
  fetch: withSupabase({ auth: "user" }, async (_req, ctx) => {
    const { data } = await ctx.supabase.from("todos").select()
    return Response.json(data)
  }),
}

Auth modes: "user" (valid JWT), "publishable" (publishable key), "secret" (secret key), "none". On Supabase Edge Functions these env vars are injected automatically; for non-"user" auth modes, set \`verify_jwt = false\` for the function in supabase/config.toml.`

// ============================================================================
// Main Schema
// ============================================================================

export const connectSchema: ConnectSchema = {
  // -------------------------------------------------------------------------
  // Mode Definitions
  // -------------------------------------------------------------------------
  modes: [
    {
      id: 'framework',
      label: 'Framework',
      description: 'Use a client library',
      fields: ['framework', 'frameworkVariant', 'library', 'frameworkUi'],
    },
    {
      id: 'server',
      label: 'Server',
      description: 'Build APIs',
      fields: [],
      prompt: serverConnectPrompt,
    },
    {
      id: 'direct',
      label: 'Direct',
      description: 'Connection string',
      fields: ['connectionSource', 'connectionMethod', 'useSharedPooler', 'connectionType'],
    },
    {
      id: 'orm',
      label: 'ORM',
      description: 'Third-party library',
      fields: ['orm'],
    },
    {
      id: 'mcp',
      label: 'MCP',
      description: 'Connect your agent',
      fields: ['mcpClient', 'mcpReadonly', 'mcpFeatures'],
    },
  ],

  // -------------------------------------------------------------------------
  // Field Definitions
  // -------------------------------------------------------------------------
  fields: {
    // Framework fields
    framework: {
      id: 'framework',
      type: 'select',
      label: 'Framework',
      options: { source: 'frameworks' },
      defaultValue: 'nextjs',
    },
    frameworkVariant: {
      id: 'frameworkVariant',
      type: 'select',
      label: 'Variant',
      options: { source: 'frameworkVariants' },
      defaultValue: 'app',
      dependsOn: { framework: ['nextjs', 'react'] }, // Only show for frameworks with multiple variants
    },
    library: {
      id: 'library',
      type: 'select',
      label: 'Library',
      options: { source: 'libraries' },
      defaultValue: 'supabasejs',
    },
    frameworkUi: {
      id: 'frameworkUi',
      type: 'switch',
      label: 'Shadcn',
      description: 'Install Supabase UI components with shadcn.',
      defaultValue: false,
      dependsOn: { framework: ['nextjs', 'react'] },
    },

    // Direct connection fields
    connectionSource: {
      id: 'connectionSource',
      type: 'select',
      label: 'Source',
      options: { source: 'connectionSources' },
      defaultValue: undefined,
    },
    connectionMethod: {
      id: 'connectionMethod',
      type: 'radio-list',
      label: 'Connection Method',
      options: { source: 'connectionMethods' },
      // Default is set per deployment mode by useConnectState.setMode('direct'):
      // platform/CLI → 'direct', self-hosted → 'session'.
    },
    useSharedPooler: {
      id: 'useSharedPooler',
      type: 'switch',
      label: 'Use IPv4 connection',
      description: 'Uses the shared pooler. Recommended on networks that do not support IPv6.',
      defaultValue: false,
      dependsOn: { connectionMethod: ['transaction'] },
    },
    connectionType: {
      id: 'connectionType',
      type: 'select',
      label: 'Type',
      options: { source: 'connectionTypes' },
      defaultValue: 'uri',
    },

    // ORM fields
    orm: {
      id: 'orm',
      type: 'radio-list',
      label: 'ORM',
      options: { source: 'orms' },
      defaultValue: 'prisma',
    },

    // MCP fields
    mcpClient: {
      id: 'mcpClient',
      type: 'select',
      label: 'Client',
      description: 'The MCP client you are using.',
      options: { source: 'mcpClients' },
      defaultValue: 'claude-code',
    },
    mcpReadonly: {
      id: 'mcpReadonly',
      type: 'switch',
      label: 'Read-only',
      description: 'Only allow read operations on your database.',
      defaultValue: false,
    },
    mcpFeatures: {
      id: 'mcpFeatures',
      type: 'multi-select',
      label: 'Feature groups',
      description:
        'Which MCP tools to include. Storage is off by default to keep tool counts manageable.',
      options: { source: 'mcpFeatures' },
      defaultValue: DEFAULT_MCP_FEATURES,
    },
  },

  // -------------------------------------------------------------------------
  // Steps - Conditional based on mode and nested selections
  // -------------------------------------------------------------------------
  steps: {
    // Keys are field IDs; each field maps state values to step trees.
    mode: {
      framework: {
        framework: {
          nextjs: {
            frameworkVariant: {
              app: {
                frameworkUi: {
                  true: [
                    frameworkInstallPackagesStep,
                    frameworkShadcnStep,
                    frameworkShadcnEnvStep,
                    skillsInstallStep,
                  ],
                  DEFAULT: [
                    frameworkInstallPackagesStep,
                    frameworkNextJsFilesStep,
                    skillsInstallStep,
                  ],
                },
              },
              DEFAULT: {
                frameworkUi: {
                  true: [
                    frameworkInstallStep,
                    frameworkShadcnStep,
                    frameworkShadcnEnvStep,
                    skillsInstallStep,
                  ],
                  DEFAULT: [frameworkInstallStep, frameworkNextJsFilesStep, skillsInstallStep],
                },
              },
            },
          },
          react: {
            frameworkUi: {
              true: [
                frameworkInstallStep,
                frameworkShadcnStep,
                frameworkShadcnEnvStep,
                skillsInstallStep,
              ],
              DEFAULT: [frameworkInstallStep, frameworkReactFilesStep, skillsInstallStep],
            },
          },
          remix: [frameworkInstallPackagesStep, frameworkConfigureStep, skillsInstallStep],
          DEFAULT: [frameworkInstallStep, frameworkConfigureStep, skillsInstallStep],
        },
      },
      direct: {
        connectionType: {
          nodejs: [directInstallStep, directFilesStep, skillsInstallStep],
          golang: [directInstallStep, directFilesStep, skillsInstallStep],
          dotnet: [directInstallStep, directFilesStep, skillsInstallStep],
          python: [directInstallStep, directFilesStep, skillsInstallStep],
          sqlalchemy: [directInstallStep, directFilesStep, skillsInstallStep],
          DEFAULT: [directConnectionStep, skillsInstallStep],
        },
      },
      orm: [ormInstallStep, ormConfigureStep, skillsInstallStep],
      mcp: {
        mcpClient: {
          codex: [codexAddServerStep, codexAuthenticateStep, codexVerifyStep, skillsInstallStep],
          'claude-code': [claudeAddServerStep, claudeAuthenticateStep, skillsInstallStep],
          DEFAULT: [mcpConfigureStep, skillsInstallStep],
        },
      },
      server: [serverInstallStep, serverEnvStep, serverSkillsInstallStep],
      DEFAULT: [skillsInstallStep],
    },
  },
}
