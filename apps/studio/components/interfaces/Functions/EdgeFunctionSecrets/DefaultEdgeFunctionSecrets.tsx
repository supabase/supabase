import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'

import { DEFAULT_EDGE_FUNCTION_SECRETS } from './DefaultEdgeFunctionSecrets.utils'

export const DefaultEdgeFunctionSecrets = () => {
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
          {DEFAULT_EDGE_FUNCTION_SECRETS.map((defaultSecret) => (
            <TableRow key={defaultSecret.name}>
              <TableCell>
                <p className="truncate py-2">{defaultSecret.name}</p>
              </TableCell>
              <TableCell>
                <p className="text-sm text-foreground-light">{defaultSecret.description}</p>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
