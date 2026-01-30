import type { ConnectSchema, StepDefinition } from './Connect.types'

/**
 * Install commands for different packages
 */
export const INSTALL_COMMANDS: Record<string, string> = {
  supabasejs: 'npm install @supabase/supabase-js',
  supabasepy: 'pip install supabase',
  supabaseflutter: 'flutter pub add supabase_flutter',
  supabaseswift:
    'swift package add-dependency https://github.com/supabase-community/supabase-swift',
  supabasekt: 'implementation("io.github.jan-tennert.supabase:supabase-kt:VERSION")',
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
  description: 'Run this command to install the Supabase shadcn components.',
  content: 'steps/shadcn/command',
}

const frameworkShadcnExploreStep: StepDefinition = {
  id: 'shadcn-explore',
  title: 'Check out more UI components',
  description: 'Add auth, realtime and storage functionality to your project',
  content: 'steps/shadcn/explore',
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
  description: 'Run this command to install the required dependencies.',
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

const codexEnableRemoteStep: StepDefinition = {
  id: 'codex-enable-remote',
  title: 'Enable remote MCP client support',
  description: 'Add this to your ~/.codex/config.toml file.',
  content: 'steps/mcp/codex/enable-remote',
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
  description: 'Run /mcp inside Codex to verify.',
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
    'After configuring the MCP server, you need to authenticate. In a regular terminal (not the IDE extension) run:',
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

const skillsInstallStep: StepDefinition = {
  id: 'install-skills',
  title: 'Install Agent Skills (Optional)',
  description:
    'Agent Skills give AI coding tools ready-made instructions, scripts, and resources for working with Supabase more accurately and efficiently.',
  content: 'steps/skills-install',
}

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
      id: 'direct',
      label: 'Direct',
      description: 'Connection string',
      fields: ['connectionMethod', 'useSharedPooler', 'connectionType'],
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
      type: 'radio-grid',
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
      description: 'Install components via the Supabase shadcn registry.',
      defaultValue: false,
      dependsOn: { framework: ['nextjs', 'react'] },
    },

    // Direct connection fields
    connectionMethod: {
      id: 'connectionMethod',
      type: 'radio-list',
      label: 'Connection Method',
      options: { source: 'connectionMethods' },
      defaultValue: 'direct',
    },
    useSharedPooler: {
      id: 'useSharedPooler',
      type: 'switch',
      label: 'Use IPv4 connection (Shared Pooler)',
      description: 'Only recommended when your network does not support IPv6',
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
      description: 'Choose the MCP client you are using.',
      options: { source: 'mcpClients' },
      defaultValue: 'cursor',
    },
    mcpReadonly: {
      id: 'mcpReadonly',
      type: 'switch',
      label: 'Read-only',
      description: 'Only allow read operations on your database',
      defaultValue: false,
    },
    mcpFeatures: {
      id: 'mcpFeatures',
      type: 'multi-select',
      label: 'Feature groups',
      description:
        'Only enable a subset of features. Helps keep the number of tools within MCP client limits.',
      options: { source: 'mcpFeatures' },
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
            frameworkUi: {
              true: [
                frameworkInstallStep,
                frameworkShadcnStep,
                frameworkShadcnExploreStep,
                skillsInstallStep,
              ],
              DEFAULT: [frameworkInstallStep, frameworkNextJsFilesStep, skillsInstallStep],
            },
          },
          react: {
            frameworkUi: {
              true: [
                frameworkInstallStep,
                frameworkShadcnStep,
                frameworkShadcnExploreStep,
                skillsInstallStep,
              ],
              DEFAULT: [frameworkInstallStep, frameworkReactFilesStep, skillsInstallStep],
            },
          },
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
          codex: [
            codexAddServerStep,
            codexEnableRemoteStep,
            codexAuthenticateStep,
            codexVerifyStep,
            skillsInstallStep,
          ],
          'claude-code': [claudeAddServerStep, claudeAuthenticateStep, skillsInstallStep],
          DEFAULT: [mcpConfigureStep, skillsInstallStep],
        },
      },
      DEFAULT: [skillsInstallStep],
    },
  },
}
