import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { Markdown } from 'ui-patterns/Markdown'
import { visit } from 'unist-util-visit' // for demo-only remark plugin

export default function MarkdownCustomization() {
  return (
    <Markdown
      remarkPlugins={[remarkJsxComponents]}
      components={{
        ErrorCodes,
      }}
    >
      {`## Auth error codes

<ErrorCodes service="auth" />
`}
    </Markdown>
  )
}

// Custom ErrorCodes component for markdown
interface ErrorCodesProps {
  service?: string
}

const ErrorCodes = ({ service = 'auth' }: ErrorCodesProps) => {
  const errorCodesByService: Record<string, Array<{ code: string; description: string }>> = {
    auth: [
      { code: 'invalid_credentials', description: 'Invalid email or password provided' },
      { code: 'session_not_found', description: 'User session not found or has expired' },
      { code: 'weak_password', description: 'Password does not meet strength requirements' },
      { code: 'email_not_confirmed', description: 'Email address has not been verified' },
      { code: 'mfa_required', description: 'Multi-factor authentication is required' },
    ],
    database: [
      { code: 'connection_timeout', description: 'Database connection timeout after 30 seconds' },
      { code: 'query_failed', description: 'Query execution failed due to syntax error' },
      {
        code: 'permission_denied',
        description: 'User does not have permission for this operation',
      },
      { code: 'row_level_security', description: 'Row-level security policy blocked the request' },
    ],
    realtime: [
      { code: 'SUBSCRIPTION_JOINED', description: 'Client successfully subscribed to a channel' },
      { code: 'SUBSCRIPTION_LEFT', description: 'Client left a subscribed channel' },
      { code: 'MESSAGE_BROADCAST', description: 'Broadcast message received on channel' },
      { code: 'PRESENCE_STATE', description: 'Presence state synchronized' },
    ],
  }

  const errorCodes = errorCodesByService[service] || errorCodesByService.auth

  return (
    <div className="my-6 w-full overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold">Error Code</TableHead>
            <TableHead className="font-semibold">Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {errorCodes.map((item) => (
            <TableRow key={item.code} className="even:bg-surface-75/75">
              <TableCell>
                <code className="text-sm font-mono">{item.code}</code>
              </TableCell>
              <TableCell>{item.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Demo-only remark plugin: turns `<PascalCase ... />` in markdown into nodes that
// react-markdown can map to entries in the `components` prop (MDX-like behavior).
const JSX_SELF_CLOSING = /^<([A-Z]\w*)((?:\s+[\w-]+(?:="[^"]*")?)*)\s*\/>$/
const ATTR_PATTERN = /([\w-]+)(?:="([^"]*)")?/g

const remarkJsxComponents = () => (tree: any) => {
  visit(tree, 'html', (node: any, index: number | undefined, parent: any) => {
    if (!parent || index === undefined) return
    const match = node.value.trim().match(JSX_SELF_CLOSING)
    if (!match) return

    const [, name, attrsStr] = match
    const properties: Record<string, string | boolean> = {}
    ATTR_PATTERN.lastIndex = 0
    let attrMatch: RegExpExecArray | null
    while ((attrMatch = ATTR_PATTERN.exec(attrsStr || '')) !== null) {
      properties[attrMatch[1]] = attrMatch[2] !== undefined ? attrMatch[2] : true
    }

    parent.children[index] = {
      type: 'jsxComponent',
      data: { hName: name, hProperties: properties },
    }
  })
}
