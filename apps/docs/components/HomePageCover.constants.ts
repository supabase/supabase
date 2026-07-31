export const setupCommand = {
  installCli: 'npm install -g supabase',
  installPlugin: 'npx plugins add supabase-community/supabase-plugin',
  initialize: 'supabase init',
} as const

export const setupCommands = [setupCommand.installCli, setupCommand.installPlugin].join('\n')

export const setupPrompt = `Help me get set up with Supabase. Do the following: 1. Install the Supabase CLI globally with \`${setupCommand.installCli}\`. 2. Install the Supabase Plugin with \`${setupCommand.installPlugin}\`. 3. Review my project and determine whether Supabase is already initialized. If it is not initialized, run \`${setupCommand.initialize}\`. 4. Suggest the most relevant next steps.`
