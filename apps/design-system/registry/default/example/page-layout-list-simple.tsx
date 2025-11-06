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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'

export default function PageLayoutListSimple() {
  const items = [
    { id: 1, name: 'Project Alpha', status: 'Active', members: 12 },
    { id: 2, name: 'Project Beta', status: 'Active', members: 8 },
    { id: 3, name: 'Project Gamma', status: 'Inactive', members: 5 },
  ]

  return (
    <div className="w-full">
      <PageHeader.Root size="large">
        <PageHeader.Summary>
          <PageHeader.Title>Projects</PageHeader.Title>
          <PageHeader.Description>
            Manage and view all your projects in one place.
          </PageHeader.Description>
        </PageHeader.Summary>
        <PageHeader.Aside>
          <Button type="primary" size="small">
            Create Project
          </Button>
        </PageHeader.Aside>
      </PageHeader.Root>

      <PageContainer size="large">
        <PageSection.Root>
          <PageSection.Content>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.status}</TableCell>
                      <TableCell>{item.members}</TableCell>
                      <TableCell className="text-right">
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
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </PageSection.Content>
        </PageSection.Root>
      </PageContainer>
    </div>
  )
}
