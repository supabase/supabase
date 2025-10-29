import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useLintRuleDeleteMutation } from 'data/lint/delete-lint-rule-mutation'
import { LintException } from 'data/lint/lint-rules-query'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
} from 'ui'
import { LintInfo } from '../Linter/Linter.constants'

interface EnableRuleModalProps {
  lint: LintInfo
  rule: LintException
}

export const EnableRuleModal = ({ lint, rule }: EnableRuleModalProps) => {
  const { ref } = useParams()
  const router = useRouter()

  const [open, setOpen] = useState(false)

  const { mutate: deleteRule, isLoading: isDeleting } = useLintRuleDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully enabled the "${lint.title}" rule`)
      setOpen(false)
    },
  })

  const onDeleteRule = () => {
    if (!ref) return console.error('Project ref is required')
    deleteRule({ projectRef: ref, ids: [rule.id] })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="default">Enable rule</Button>
      </DialogTrigger>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>Confirm to enable rule</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          <p className="text-sm">
            The "{lint.title}" rule will be visible in the Advisor reports, and will be included in
            email notifications for this project.
          </p>
        </DialogSection>
        <DialogFooter>
          <Button disabled={isDeleting} type="default" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button loading={isDeleting} type="primary" onClick={onDeleteRule}>
            Enable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
