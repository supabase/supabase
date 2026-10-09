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
        <Button>Export results</Button>
      </DialogTrigger>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>Export results</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          <p className="text-sm text-foreground-light">
            All 250 rows will be downloaded as a CSV file.
          </p>
        </DialogSection>
        <DialogSectionSeparator />
        <DialogDisclosure>
          <DialogDisclosureTrigger className="px-4 py-4 md:px-5">
            What’s included
          </DialogDisclosureTrigger>
          <DialogDisclosureContent>
            <DialogSection className="pt-1 text-sm text-foreground-light space-y-3">
              <p>The file includes column names in the first row, followed by the query results.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Columns keep the same order as the results table.</li>
                <li>Empty fields represent null values.</li>
                <li>Values containing commas or line breaks are enclosed in double quotes.</li>
              </ul>
              <p>Open the file in a spreadsheet or import it into another tool.</p>
            </DialogSection>
          </DialogDisclosureContent>
        </DialogDisclosure>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="primary">Download CSV</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
