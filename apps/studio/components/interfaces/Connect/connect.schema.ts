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
// ============================================================================

const frameworkInstallStep: StepDefinition = {
  id: 'install',
  title: 'Install package',
  description: 'Run this command to install the required dependencies.',
  content: 'InstallStep',
}

const frameworkConfigureStep: StepDefinition = {
  id: 'configure',
  title: 'Add files',
  description: 'Copy the following code into your project.',
  content: 'FrameworkContentStep',
}

const frameworkNextJsFilesStep: StepDefinition = {
  id: 'configure-nextjs',
  title: 'Add files',
  description:
    'Add env variables, create Supabase client helpers, and set up middleware to keep sessions refreshed.',
  content: 'FrameworkContentStep',
}

const frameworkReactFilesStep: StepDefinition = {
  id: 'configure-react',
  title: 'Add files',
  description:
    'Add env variables, create a Supabase client, and use it in your app to query data.',
  content: 'FrameworkContentStep',
}

const frameworkShadcnStep: StepDefinition = {
  id: 'shadcn-add',
  title: 'Add Supabase UI components',
  description: 'Run this command to install the Supabase shadcn components.',
  content: 'ShadcnCommandStep',
}

const frameworkShadcnExploreStep: StepDefinition = {
  id: 'shadcn-explore',
  title: 'Check out more UI components',
  description: 'Add auth, realtime and storage functionality to your project',
  content: 'ShadcnUiStep',
}

const directConnectionStep: StepDefinition = {
  id: 'connection',
  title: 'Connection string',
  description: 'Copy the connection details for your database.',
  content: 'DirectConnectionStep',
}

const directInstallStep: StepDefinition = {
  id: 'direct-install',
  title: 'Install dependencies',
  description: 'Run this command to install the required dependencies.',
  content: 'DirectConnectionInstallStep',
}

const directFilesStep: StepDefinition = {
  id: 'direct-files',
  title: 'Add files',
  description: 'Add the following files to your project.',
  content: 'DirectConnectionStep',
}

const mcpConfigureStep: StepDefinition = {
  id: 'configure-mcp',
  title: 'Configure MCP',
  description: 'Set up your MCP client.',
  content: 'McpConfigStep',
}

// Codex-specific MCP steps
const codexAddServerStep: StepDefinition = {
  id: 'codex-add-server',
  title: 'Add the Supabase MCP server to Codex',
  description: 'Run this command to add the server.',
  content: 'CodexAddServerStep',
}

const codexEnableRemoteStep: StepDefinition = {
  id: 'codex-enable-remote',
  title: 'Enable remote MCP client support',
  description: 'Add this to your ~/.codex/config.toml file.',
  content: 'CodexEnableRemoteStep',
}

const codexAuthenticateStep: StepDefinition = {
  id: 'codex-authenticate',
  title: 'Authenticate',
  description: 'Run the authentication command.',
  content: 'CodexAuthenticateStep',
}

const codexVerifyStep: StepDefinition = {
  id: 'codex-verify',
  title: 'Verify authentication',
  description: 'Run /mcp inside Codex to verify.',
  content: 'CodexVerifyStep',
}

const claudeAddServerStep: StepDefinition = {
  id: 'claude-add-server',
  title: 'Add MCP server',
  description: 'Add the MCP server to your project config using the command line.',
  content: 'ClaudeAddServerStep',
}

const claudeAuthenticateStep: StepDefinition = {
  id: 'claude-authenticate',
  title: 'Authenticate',
  description:
    'After configuring the MCP server, you need to authenticate. In a regular terminal (not the IDE extension) run:',
  content: 'ClaudeAuthenticateStep',
}

const ormInstallStep: StepDefinition = {
  id: 'install',
  title: 'Install ORM',
  description: 'Add the ORM to your project.',
  content: 'OrmInstallStep',
}

const ormConfigureStep: StepDefinition = {
  id: 'configure',
  title: 'Configure ORM',
  description: 'Set up your ORM configuration.',
  content: 'OrmContentStep',
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
    // Framework mode steps
    framework: {
      nextjs: {
        true: [frameworkInstallStep, frameworkShadcnStep, frameworkShadcnExploreStep],
        DEFAULT: [frameworkInstallStep, frameworkNextJsFilesStep],
      },
      react: {
        true: [frameworkInstallStep, frameworkShadcnStep, frameworkShadcnExploreStep],
        DEFAULT: [frameworkInstallStep, frameworkReactFilesStep],
      },
      DEFAULT: [frameworkInstallStep, frameworkConfigureStep],
    },

    // Direct connection mode - conditional steps based on connection type
    direct: {
      nodejs: [directInstallStep, directFilesStep],
      golang: [directInstallStep, directFilesStep],
      dotnet: [directInstallStep, directFilesStep],
      python: [directInstallStep, directFilesStep],
      sqlalchemy: [directInstallStep, directFilesStep],
      DEFAULT: [directConnectionStep],
    },

    // ORM mode steps
    orm: [ormInstallStep, ormConfigureStep],

    // MCP mode - conditional steps based on client
    mcp: {
      codex: [
        codexAddServerStep,
        codexEnableRemoteStep,
        codexAuthenticateStep,
        codexVerifyStep,
      ],
      'claude-code': [claudeAddServerStep, claudeAuthenticateStep],
      DEFAULT: [mcpConfigureStep],
    },

    // Fallback
    DEFAULT: [],
  },
}
