import { MultipleCodeBlock } from 'ui-patterns/MultipleCodeBlock'

function ServerInstallContent() {
  const files = [
    {
      name: 'npm',
      language: 'bash',
      code: 'npm install @supabase/server',
    },
    {
      name: 'pnpm',
      language: 'bash',
      code: 'pnpm add @supabase/server',
    },
    {
      name: 'Deno',
      language: 'ts',
      code: `import { withSupabase } from "npm:@supabase/server"`,
    },
  ]

  return <MultipleCodeBlock files={files} />
}

export default ServerInstallContent
