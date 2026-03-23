import { formatDistanceToNow } from 'date-fns'
import {
  Badge,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import type { PrivateApp } from '../../PrivateAppsContext'

interface ViewAppSheetInfoProps {
  app: PrivateApp
  isInstalled: boolean
}

export function ViewAppSheetInfo({ app, isInstalled }: ViewAppSheetInfoProps) {
  return (
    <div className="px-5 sm:px-6 py-6 space-y-3">
      <h3 className="text-sm font-medium text-foreground">Metadata</h3>
      <Card className="w-full overflow-hidden bg-surface-100">
        <CardContent className="p-0">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2 w-[50%]">
                  Field
                </TableHead>
                <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2 w-[50%]">
                  Value
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <p className="text-foreground-light truncate">Name</p>
                </TableCell>
                <TableCell>
                  <p className="font-medium truncate">{app.name}</p>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <p className="text-foreground-light truncate">Created</p>
                </TableCell>
                <TableCell>
                  <p className="truncate">
                    {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                  </p>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <p className="text-foreground-light truncate">Status</p>
                </TableCell>
                <TableCell>
                  {isInstalled ? (
                    <Badge variant="success" className="uppercase">
                      Installed
                    </Badge>
                  ) : (
                    <Badge variant="default" className="uppercase">
                      Uninstalled
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
