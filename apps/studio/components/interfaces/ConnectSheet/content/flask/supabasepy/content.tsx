import { MultipleCodeBlock } from 'ui-patterns/MultipleCodeBlock'

import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'

const ContentFile = ({ projectKeys }: StepContentProps) => {
  const keyName = projectKeys?.publishableKey
    ? 'SUPABASE_PUBLISHABLE_KEY'
    : 'SUPABASE_ANON_KEY'
  const keyValue = projectKeys?.publishableKey ?? projectKeys?.anonKey ?? 'your-anon-key'

  const files = [
    {
      name: '.env',
      language: 'bash',
      code: `
SUPABASE_URL=${projectKeys.apiUrl ?? 'your-project-url'}
${keyName}=${keyValue}
        `,
    },
    {
      name: 'app.py',
      language: 'python',
      code: `
import os
from flask import Flask
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("${keyName}")
)

@app.route('/')
def index():
    response = supabase.table('todos').select("*").execute()
    todos = response.data

    html = '<h1>Todos</h1><ul>'
    for todo in todos:
        html += f'<li>{todo["name"]}</li>'
    html += '</ul>'

    return html

if __name__ == '__main__':
    app.run(debug=True)
`,
    },
  ]

  return <MultipleCodeBlock files={files} />
}

export default ContentFile
