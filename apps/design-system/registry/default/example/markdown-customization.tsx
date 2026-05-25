import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { Markdown } from 'ui-patterns/Markdown'

// Custom ErrorCodes component for markdown
const ErrorCodes = () => {
  const errorCodes = [
    { code: 'AUTH_001', description: 'Invalid credentials provided' },
    { code: 'AUTH_002', description: 'Session token has expired' },
    { code: 'DB_001', description: 'Database connection timeout' },
    { code: 'DB_002', description: 'Query execution failed' },
  ]

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

export default function MarkdownCustomization() {
  return <ErrorCodes />
}
