import { Card, Table, TableBody, TableCell, TableRow } from 'ui'

import { HooksTableHeader } from './HooksTableHeader'

export const HooksListEmpty = () => {
  return (
    <Card>
      <Table className="table-fixed">
        <HooksTableHeader />
        <TableBody>
          <TableRow>
            <TableCell colSpan={5}>
              <p className="text-sm text-foreground">No hooks created yet</p>
              <p className="text-sm text-foreground-light">
                Create a new hook by clicking "Create a new hook"
              </p>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  )
}
