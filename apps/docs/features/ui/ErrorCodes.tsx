import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import _authErrorCodes from '~/content/errorCodes/authErrorCodes.toml'
import _realtimeErrorCodes from '~/content/errorCodes/realtimeErrorCodes.toml'
import { type ErrorCodeDefinition } from '~/resources/error/errorTypes'

const errorCodesByService = {
  auth: _authErrorCodes as Record<string, ErrorCodeDefinition>,
  realtime: _realtimeErrorCodes as Record<string, ErrorCodeDefinition>,
}

interface ErrorCodesProps {
  service: keyof typeof errorCodesByService
}

export function ErrorCodes({ service }: ErrorCodesProps) {
  const errorCodes = errorCodesByService[service]
  const hasResolutions = Object.values(errorCodes).some((code) => code.resolution)
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Error code</TableHead>
          <TableHead>Description</TableHead>
          {hasResolutions && <TableHead>Action</TableHead>}
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
              {hasResolutions && (
                <TableCell>{!!definition.resolution && <p>{definition.resolution}</p>}</TableCell>
              )}
            </TableRow>
          ))}
      </TableBody>
    </Table>
  )
}
