import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import _errorCodes from '~/content/errorCodes/authErrorCodes.toml'
import { type ErrorCodeDefinition } from '~/resources/error/errorTypes'

const errorCodes: Record<string, ErrorCodeDefinition> = _errorCodes

export function AuthErrorCodes() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Error code</TableHead>
          <TableHead>Description</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.entries(errorCodes)
          .sort(([aCode], [bCode]) => aCode.localeCompare(bCode))
          .map(([code, definition]) => (
            <TableRow key={code}>
              <TableCell>
                <code className="whitespace-nowrap">{code}</code>
              </TableCell>
              <TableCell>
                <p>{definition.description}</p>
                {!!definition.references && (
                  <>
                    <p>Learn more:</p>
                    <ul>
                      {definition.references.map((reference) => (
                        <li key={reference.href}>
                          <Link href={reference.href}>{reference.description}</Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  )
}
