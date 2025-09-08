import { zodResolver } from '@hookform/resolvers/zod'
import { type SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod'

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { useStorageExplorerStateSnapshot } from 'state/storage-explorer'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

export interface MoveItemsModalProps {
  onClose?: () => void
}

const PathSchema = z.object({
  path: z.string().min(0, 'Please provide a valid path name'),
})

const formId = `move_items_form`

export const MoveItemsModal = ({ onClose }: MoveItemsModalProps) => {
  const { selectedItemsToMove, selectedBucket, moveFiles, setSelectedItemsToMove } =
    useStorageExplorerStateSnapshot()
  const form = useForm<z.infer<typeof PathSchema>>({
    resolver: zodResolver(PathSchema),
    defaultValues: { path: '' },
    mode: 'onSubmit',
  })

  const isMoving = form.formState.isSubmitting

  const multipleFiles = selectedItemsToMove.length > 1

  const title = multipleFiles
    ? `Moving ${selectedItemsToMove.length} items within ${selectedBucket.name}`
    : selectedItemsToMove.length === 1
      ? `Moving ${selectedItemsToMove[0]?.name} within ${selectedBucket.name}`
      : ``

  const description = `Enter the path to where you'd like to move the file${
    multipleFiles ? 's' : ''
  } to.`

  const handleClose = () => {
    setSelectedItemsToMove([])
    form.reset()
    onClose?.()
  }

  const onSubmit: SubmitHandler<z.infer<typeof PathSchema>> = async (values) => {
    const formattedPath = values.path[0] === '/' ? values.path.slice(1) : values.path
    await moveFiles(formattedPath)
    handleClose()
  }

  return (
    <Dialog
      open={selectedItemsToMove.length > 0}
      onOpenChange={(open) => {
        if (!open) {
          handleClose()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          <Form_Shadcn_ {...form}>
            <form
              id={formId}
              className="flex flex-col gap-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField_Shadcn_
                key="path"
                name="path"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    name="path"
                    label={`Path to new directory in ${selectedBucket.name}`}
                    description="Leave blank to move items to the root of the bucket"
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        id="path"
                        {...field}
                        autoFocus
                        autoComplete="off"
                        placeholder="e.g folder1/subfolder2"
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </form>
          </Form_Shadcn_>
        </DialogSection>
        <DialogFooter>
          <Button type="default" loading={isMoving} onClick={handleClose}>
            Cancel
          </Button>
          <Button form={formId} type="primary" htmlType="submit" loading={isMoving}>
            {isMoving ? 'Moving files' : 'Move files'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default MoveItemsModal
