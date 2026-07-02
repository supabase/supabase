import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

// Demo ErrorCodes component — mirrors the real `<ErrorCodes service="..." />` used in
// apps/docs MDX files (e.g. apps/docs/content/guides/auth/debugging/error-codes.mdx).
interface ErrorCodesProps {
  service?: string
}

const ERROR_CODES: Record<string, Array<{ code: string; description: string }>> = {
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
    { code: 'permission_denied', description: 'User does not have permission for this operation' },
    { code: 'row_level_security', description: 'Row-level security policy blocked the request' },
  ],
  realtime: [
    { code: 'SUBSCRIPTION_JOINED', description: 'Client successfully subscribed to a channel' },
    { code: 'SUBSCRIPTION_LEFT', description: 'Client left a subscribed channel' },
    { code: 'MESSAGE_BROADCAST', description: 'Broadcast message received on channel' },
    { code: 'PRESENCE_STATE', description: 'Presence state synchronized' },
  ],
}

export const ErrorCodes = ({ service = 'auth' }: ErrorCodesProps) => {
  const errorCodes = ERROR_CODES[service] || ERROR_CODES.auth

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
