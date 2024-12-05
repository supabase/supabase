import { CodeBlockLang } from 'ui'

export type ConnectionType =
  | 'uri'
  | 'psql'
  | 'golang'
  | 'jdbc'
  | 'dotnet'
  | 'nodejs'
  | 'php'
  | 'python'
  | 'sqlalchemy'

export const CONNECTION_TYPES: {
  id: ConnectionType
  label: string
  contentType: 'input' | 'code'
  lang: CodeBlockLang
  fileTitle: string | undefined
}[] = [
  { id: 'uri', label: 'URI', contentType: 'input', lang: 'bash', fileTitle: undefined },
  { id: 'psql', label: 'PSQL', contentType: 'code', lang: 'bash', fileTitle: undefined },
  { id: 'golang', label: 'Golang', contentType: 'code', lang: 'go', fileTitle: '.env' },
  { id: 'jdbc', label: 'JDBC', contentType: 'input', lang: 'bash', fileTitle: undefined },
  {
    id: 'dotnet',
    label: '.NET',
    contentType: 'code',
    lang: 'csharp',
    fileTitle: 'appsettings.json',
  },
  { id: 'nodejs', label: 'Node.js', contentType: 'code', lang: 'js', fileTitle: '.env' },
  { id: 'php', label: 'PHP', contentType: 'code', lang: 'php', fileTitle: '.env' },
  { id: 'python', label: 'Python', contentType: 'code', lang: 'python', fileTitle: '.env' },
  { id: 'sqlalchemy', label: 'SQLAlchemy', contentType: 'code', lang: 'python', fileTitle: '.env' },
]

export const CONNECTION_PARAMETERS = {
  host: {
    key: 'host',
    description: 'The hostname of your database',
  },
  port: {
    key: 'port',
    description: 'Port number for the connection',
  },
  database: {
    key: 'database',
    description: 'Default database name',
  },
  user: {
    key: 'user',
    description: 'Database user',
  },
  pool_mode: {
    key: 'pool_mode',
    description: 'Connection pooling behavior',
  },
} as const
