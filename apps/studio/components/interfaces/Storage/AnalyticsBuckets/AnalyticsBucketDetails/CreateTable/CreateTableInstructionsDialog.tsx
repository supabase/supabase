import { useFlag } from 'common'
import { ChevronDown, Plus } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { CreateTableInstructions } from './CreateTableInstructions'
import { CreateTableSheet } from './CreateTableSheet'

export const CreateTableInstructionsDialog = () => {
  const enableCreationOfTablesFromDashboard = useFlag('analyticsBucketsTableCreation')

  const [showModal, setShowModal] = useState(false)
  const [showSheet, setShowSheet] = useState(false)

  return (
    <>
      <div className="flex items-center">
        <Button
          type="primary"
          icon={<Plus />}
          className={cn(enableCreationOfTablesFromDashboard && 'rounded-r-none hover:z-10')}
          onClick={() => {
            if (enableCreationOfTablesFromDashboard) setShowSheet(true)
            else setShowModal(true)
          }}
        >
          Create table
        </Button>
        {enableCreationOfTablesFromDashboard && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="primary"
                className="w-7 rounded-l-none -ml-[1px]"
                icon={<ChevronDown />}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48" align="end">
              <DropdownMenuItem onClick={() => setShowModal(true)}>Via Pyiceberg</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
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

      <CreateTableSheet open={showSheet} onOpenChange={setShowSheet} />
    </>
  )
}
