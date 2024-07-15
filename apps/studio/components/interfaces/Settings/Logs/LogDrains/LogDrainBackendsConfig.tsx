import { Label } from '@ui/components/shadcn/ui/label'
import { useParams } from 'common'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import Panel from 'components/ui/Panel'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useLogBackendsQuery } from 'data/analytics/backends/backends-query'
import { useState } from 'react'
import {
  Button,
  Input,
  Input_Shadcn_,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from 'ui'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from 'ui'
import { RadioGroupStacked, RadioGroupStackedItem } from 'ui'

export default function LogBackendsConfig() {
  const { ref } = useParams()

  const { data: backends, isLoading: backendsLoading } = useLogBackendsQuery({
    ref,
  })

  const [backendType, setBackendType] = useState('webhook')

  return (
    <div>
      <FormHeader
        title="Backends"
        description="Add a custom backend for your log drains"
        actions={
          <>
            <Sheet>
              <SheetTrigger asChild>
                <Button type="outline">New backend</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>New backend</SheetTitle>
                  <SheetDescription>Add a custom backend for your log drains</SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4 px-4">
                  <div>
                    <Label>Name</Label>
                    <Input_Shadcn_
                      placeholder="
                    Backend name
                    "
                    ></Input_Shadcn_>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input_Shadcn_ placeholder="Description"></Input_Shadcn_>
                  </div>
                  <RadioGroupStacked
                    defaultValue="webhook"
                    value={backendType}
                    onValueChange={setBackendType}
                  >
                    <RadioGroupStackedItem value="webhook" id="webhook" label="Webhook" />
                    <RadioGroupStackedItem value="postgres" id="postgres" label="Postgres" />
                    <RadioGroupStackedItem value="bigquery" id="bigquery" label="BigQuery" />
                    <RadioGroupStackedItem value="datadog" id="datadog" label="Datadog" />
                  </RadioGroupStacked>

                  {backendType === 'webhook' && (
                    <>
                      <Label>Webhook URL</Label>
                      <Input_Shadcn_ placeholder="https://example.com/webhook"></Input_Shadcn_>
                    </>
                  )}
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button htmlType="submit" type="primary">
                      Save changes
                    </Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </>
        }
      ></FormHeader>

      <Panel>
        {backendsLoading ? (
          <>
            <GenericSkeletonLoader />
          </>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Updated At</TableCell>
                <TableCell>
                  <div className="sr-only">Actions</div>
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backends?.map((backend) => (
                <TableRow key={backend.id}>
                  <TableCell>{backend.name}</TableCell>
                  <TableCell>{backend.inserted_at}</TableCell>
                  <TableCell>{backend.updated_at}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  )
}
