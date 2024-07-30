import { Copy } from 'lucide-react'

import { Button, DialogSection, DialogSectionSeparator } from 'ui'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from 'ui'
import { Input_Shadcn_ } from 'ui'
import { Label_Shadcn_ } from 'ui'

export default function DialogCloseButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="default">Share</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader padding={'small'}>
          <DialogTitle>Share link</DialogTitle>
          <DialogDescription>Anyone who has this link will be able to view this.</DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection padding={'small'}>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label_Shadcn_ htmlFor="link" className="sr-only">
                Link
              </Label_Shadcn_>
              <Input_Shadcn_
                id="link"
                defaultValue="https://ui.shadcn.com/docs/installation"
                readOnly
              />
            </div>
            <Button htmlType="submit" size="small" type="secondary" className="px-3">
              <span className="sr-only">Copy</span>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </DialogSection>
        <DialogFooter className="sm:justify-start" padding={'small'}>
          <DialogClose asChild>
            <Button type="default" htmlType="button">
              Custom Close Button
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
