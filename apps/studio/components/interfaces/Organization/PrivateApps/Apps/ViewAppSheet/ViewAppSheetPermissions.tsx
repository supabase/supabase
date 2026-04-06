import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'

import type { Permission } from '../Apps.constants'

interface ViewAppSheetPermissionsProps {
  permissions: Permission[]
  isLoading: boolean
}

export function ViewAppSheetPermissions({ permissions, isLoading }: ViewAppSheetPermissionsProps) {
  return (
    <div className="px-5 sm:px-6 py-6 space-y-3">
      <h3 className="text-sm font-medium text-foreground">Permissions</h3>
      {isLoading ? (
        <p className="text-sm text-foreground-light py-4">Loading permissions...</p>
      ) : (
        <Card className="w-full overflow-hidden bg-surface-100">
          <CardContent className="p-0">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2 w-[40%]">
                    Permission
                  </TableHead>
                  <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2 w-[60%]">
                    Description
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2}>
                      <p className="text-foreground-light text-center py-4">
                        No permissions configured
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  permissions.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <p className="text-sm truncate">{p.label}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-foreground-light text-sm truncate">{p.description}</p>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
