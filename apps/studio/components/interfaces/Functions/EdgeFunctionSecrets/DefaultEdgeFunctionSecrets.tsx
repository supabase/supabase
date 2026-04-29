import { Badge, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

import type { DefaultEdgeFunctionSecret } from './DefaultEdgeFunctionSecrets.utils'

interface DefaultEdgeFunctionSecretsProps {
  secrets: DefaultEdgeFunctionSecret[]
}

export const DefaultEdgeFunctionSecrets = ({ secrets }: DefaultEdgeFunctionSecretsProps) => {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {secrets.map((secret) => (
            <TableRow key={secret.name}>
              <TableCell>
                <div className="flex items-center gap-x-2 py-2">
                  <p className="truncate">{secret.name}</p>
                  {secret.isDeprecated && <Badge variant="warning">Deprecated</Badge>}
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm text-foreground-light">{secret.description}</p>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
