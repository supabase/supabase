import { PageContainer } from 'ui-patterns/PageContainer'
import { PageHeader } from 'ui-patterns/PageHeader'
import { PageSection } from 'ui-patterns/PageSection'
import {
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Search } from 'lucide-react'

export default function PageLayoutList() {
  const functions = [
    {
      id: 1,
      name: 'get_user_profile',
      arguments: 'user_id uuid',
      return_type: 'jsonb',
      security: 'Definer',
    },
    {
      id: 2,
      name: 'update_user_settings',
      arguments: 'user_id uuid, settings jsonb',
      return_type: 'void',
      security: 'Invoker',
    },
    {
      id: 3,
      name: 'calculate_total',
      arguments: 'amount numeric, tax_rate numeric',
      return_type: 'numeric',
      security: 'Definer',
    },
  ]

  return (
    <div className="w-full">
      <PageHeader.Root size="large">
        <PageHeader.Summary>
          <PageHeader.Title>Database Functions</PageHeader.Title>
          <PageHeader.Description>Manage your database functions</PageHeader.Description>
        </PageHeader.Summary>
      </PageHeader.Root>

      <PageContainer size="large">
        <PageSection.Root>
          <PageSection.Content>
            <div className="w-full space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 flex-wrap">
                <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                  <Input
                    placeholder="Search for a function"
                    size="tiny"
                    icon={<Search size={14} />}
                    className="w-full lg:w-52"
                  />
                </div>
                <Button type="primary">Create a new function</Button>
              </div>

              <Card>
                <Table className="table-fixed overflow-x-auto">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="table-cell">Arguments</TableHead>
                      <TableHead className="table-cell">Return type</TableHead>
                      <TableHead className="table-cell w-[100px]">Security</TableHead>
                      <TableHead className="w-1/6"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {functions.map((fn) => (
                      <TableRow key={fn.id}>
                        <TableCell className="font-medium">{fn.name}</TableCell>
                        <TableCell>{fn.arguments}</TableCell>
                        <TableCell>{fn.return_type}</TableCell>
                        <TableCell>{fn.security}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="text" size="small">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem>Duplicate</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </PageSection.Content>
        </PageSection.Root>
      </PageContainer>
    </div>
  )
}
