import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
} from 'ui'
import {
  DialogDisclosure,
  DialogDisclosureContent,
  DialogDisclosureTrigger,
} from 'ui-patterns/DialogDisclosure'

export default function DialogDisclosureDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>View connection details</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connection details</DialogTitle>
          <DialogDescription>
            Review how your application connects to this project.
          </DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          <p className="text-sm text-foreground-light">This project uses direct connections.</p>
        </DialogSection>
        <DialogSectionSeparator />
        <DialogDisclosure>
          <DialogDisclosureTrigger className="px-4 py-4 md:px-5">
            When should I use pooling?
          </DialogDisclosureTrigger>
          <DialogDisclosureContent>
            <DialogSection className="pt-1 text-sm text-foreground-light">
              Use connection pooling when your application opens many short-lived connections.
            </DialogSection>
          </DialogDisclosureContent>
        </DialogDisclosure>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
