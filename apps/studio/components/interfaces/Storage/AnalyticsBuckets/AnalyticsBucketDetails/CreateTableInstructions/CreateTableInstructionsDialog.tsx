import { Plus } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from 'ui'
import { CreateTableInstructions } from '.'

export const CreateTableInstructionsDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="primary" icon={<Plus />}>
          Create table
        </Button>
      </DialogTrigger>
      <DialogContent size="xlarge">
        <DialogHeader>
          <DialogTitle>Adding tables to your Analytics Bucket</DialogTitle>
          <DialogDescription>
            Tables can be created or added to your bucket via Pyiceberg
          </DialogDescription>
        </DialogHeader>
        <CreateTableInstructions hideHeader className="rounded-t-none border-x-0 border-b-0" />
      </DialogContent>
    </Dialog>
  )
}
