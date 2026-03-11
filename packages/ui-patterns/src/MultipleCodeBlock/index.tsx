import {
  CodeBlock,
  CodeBlockLang,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
} from 'ui'

interface MultipleCodeBlockFile {
  name: string
  code: string
  language?: string
}

interface MultipleCodeBlockProps {
  files: MultipleCodeBlockFile[]
  value?: string
  onValueChange?: (value: string) => void
}

const languageAliases: Record<string, CodeBlockLang> = {
  bash: 'bash',
  csharp: 'csharp',
  cs: 'csharp',
  curl: 'curl',
  dart: 'dart',
  go: 'go',
  http: 'http',
  javascript: 'js',
  js: 'js',
  json: 'json',
  jsx: 'jsx',
  kotlin: 'kotlin',
  pgsql: 'pgsql',
  php: 'php',
  py: 'python',
  python: 'python',
  sh: 'bash',
  shell: 'bash',
  sql: 'sql',
  swift: 'swift',
  ts: 'ts',
  typescript: 'ts',
  yaml: 'yaml',
  yml: 'yaml',
}

const extensionLanguageMap: Record<string, CodeBlockLang> = {
  astro: 'html',
  bash: 'bash',
  cjs: 'js',
  dart: 'dart',
  go: 'go',
  js: 'js',
  json: 'json',
  jsx: 'jsx',
  kt: 'kotlin',
  mjs: 'js',
  php: 'php',
  pgsql: 'pgsql',
  py: 'python',
  sh: 'bash',
  sql: 'sql',
  swift: 'swift',
  svelte: 'html',
  ts: 'ts',
  vue: 'html',
  yaml: 'yaml',
  yml: 'yaml',
}

const inferLanguageFromName = (name: string): CodeBlockLang | undefined => {
  const lowerName = name.toLowerCase()
  if (lowerName.startsWith('.env')) {
    return 'bash'
  }

  const extension = lowerName.split('.').pop()
  if (!extension || extension === lowerName) {
    return undefined
  }

  return extensionLanguageMap[extension]
}

const resolveLanguage = (language: string | undefined, name: string): CodeBlockLang => {
  if (language) {
    const normalized = language.toLowerCase()
    const resolved = languageAliases[normalized]
    if (resolved) {
      return resolved
    }
  }

  return inferLanguageFromName(name) ?? 'js'
}

export const MultipleCodeBlock = ({ files, value, onValueChange }: MultipleCodeBlockProps) => {
  if (!files?.length) {
    return null
  }

  const defaultValue = files[0]?.name ?? ''

  const trimmedFiles = files.map((file) => ({
    ...file,
    code: typeof file.code === 'string' ? file.code.trim() : file.code,
  }))

  return (
    <Tabs_Shadcn_
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      className="border rounded-lg gap-0 space-y-0 overflow-hidden"
    >
      <TabsList_Shadcn_ className="bg-surface-75 px-5 gap-5 overflow-x-auto border-0 border-b">
        {files.map((file) => (
          <TabsTrigger_Shadcn_
            key={file.name}
            value={file.name}
            className="flex items-center gap-1 text-xs px-0 data-[state=active]:bg-transparent py-2.5"
          >
            {file.name}
          </TabsTrigger_Shadcn_>
        ))}
      </TabsList_Shadcn_>

      {trimmedFiles.map((file) => (
        <TabsContent_Shadcn_
          key={file.name}
          value={file.name}
          forceMount
          className="p-0 max-h-72 overflow-scroll data-[state=inactive]:hidden"
          data-connect-tab-content
          data-tab-label={file.name}
        >
          <CodeBlock
            value={typeof file.code === 'string' ? file.code.trim() : file.code}
            language={resolveLanguage(file.language, file.name)}
            className="min-h-72 !bg-surface-75 rounded-none border-0"
          />
        </TabsContent_Shadcn_>
      ))}
    </Tabs_Shadcn_>
  )
}
