interface InvocationTab {
  id: string
  label: string
  language: 'bash' | 'js' | 'ts' | 'dart' | 'python'
  hideLineNumbers?: boolean
  code: (functionUrl: string, functionName: string, apiKey: string) => string
}

export const INVOCATION_TABS: InvocationTab[] = [
  {
    id: 'curl',
    label: 'cURL',
    language: 'bash',
    code: (functionUrl, _, apiKey) => `curl -L -X POST '${functionUrl}' \\
  -H 'Authorization: Bearer ${apiKey}' \\ ${apiKey.includes('publishable') ? `\n  -H 'apikey: ${apiKey}' \\` : ''}
  -H 'Content-Type: application/json' \\
  --data '{"name":"Functions"}'`,
  },
  {
    id: 'supabase-js',
    label: 'JavaScript',
    language: 'js',
    hideLineNumbers: true,
    code: (_, functionName) => `import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
const { data, error } = await supabase.functions.invoke('${functionName}', {
  body: { name: 'Functions' },
})`,
  },
  {
    id: 'swift',
    label: 'Swift',
    language: 'ts',
    hideLineNumbers: true,
    code: (_, functionName) => `struct Response: Decodable {
  // Expected response definition
}

let response: Response = try await supabase.functions
  .invoke(
    "${functionName}",
    options: FunctionInvokeOptions(
      body: ["name": "Functions"]
    )
  )`,
  },
  {
    id: 'flutter',
    label: 'Flutter',
    language: 'dart',
    hideLineNumbers: true,
    code: (
      _,
      functionName
    ) => `final res = await supabase.functions.invoke('${functionName}', body: {'name': 'Functions'});
final data = res.data;`,
  },
  {
    id: 'python',
    label: 'Python',
    language: 'python',
    hideLineNumbers: true,
    code: (_, functionName) => `response = supabase.functions.invoke(
    "${functionName}",
    invoke_options={"body": {"name": "Functions"}}
)`,
  },
]

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as const
