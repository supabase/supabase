import {
  Accordion_Shadcn_,
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  AccordionTrigger_Shadcn_,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'
import { Admonition } from 'ui-patterns'

interface ReplicationDisclaimerDialogProps {
  open: boolean
  isLoading: boolean
  onOpenChange: (value: boolean) => void
  onConfirm: () => void
}

export const ReplicationDisclaimerDialog = ({
  open,
  isLoading,
  onOpenChange,
  onConfirm,
}: ReplicationDisclaimerDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Before creating this pipeline</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="space-y-4 text-sm">
          <p className="text-foreground">
            Creating this replication pipeline will immediately start syncing data from your
            publication into the destination. Make sure you understand requirements and limitations
            of the system before proceeding.
          </p>

          <Admonition type="warning" className="space-y-1 px-4 py-3">
            <p className="font-medium text-foreground">Primary keys are required for all tables</p>
            <p className="text-foreground-light">
              Every table included in the publication must expose a primary key for replication to
              work correctly.
            </p>
          </Admonition>

          <Accordion_Shadcn_ type="single" collapsible>
            <AccordionItem_Shadcn_ value="limitations" className="border-none">
              <AccordionTrigger_Shadcn_ className="justify-between gap-2 text-sm font-medium py-2">
                View limitations
              </AccordionTrigger_Shadcn_>
              <AccordionContent_Shadcn_ className="pt-2">
                <div className="text-foreground-light">
                  <ul className="list-disc flex flex-col gap-y-1.5 pl-5 text-sm leading-snug">
                    <li>
                      <strong className="text-foreground">
                        Custom data types replicate as strings.
                      </strong>{' '}
                      Check that the destination can interpret those string values correctly.
                    </li>
                    <li>
                      <strong className="text-foreground">Generated columns are skipped.</strong>{' '}
                      Replace them with triggers or materialized views if you need the derived
                      values downstream.
                    </li>
                    <li>
                      <strong className="text-foreground">
                        FULL replica identity is strongly recommended.
                      </strong>{' '}
                      With FULL replica identity deletes and updates include the payload that is
                      needed to correctly apply those changes.
                    </li>
                    <li>
                      <strong className="text-foreground">
                        Schema changes aren’t supported yet.
                      </strong>{' '}
                      Plan for manual adjustments if you need to alter replicated tables.
                    </li>
                  </ul>
                </div>
              </AccordionContent_Shadcn_>
            </AccordionItem_Shadcn_>
          </Accordion_Shadcn_>
        </DialogSection>
        <DialogSectionSeparator />
        <DialogFooter>
          <Button type="default" disabled={isLoading} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button loading={isLoading} onClick={onConfirm}>
            Understood, start replication
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
