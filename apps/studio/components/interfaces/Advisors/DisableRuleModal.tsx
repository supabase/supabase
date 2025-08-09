import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useLintRuleCreateMutation } from 'data/lint/create-lint-rule-mutation'
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
import { lintInfoMap } from '../Linter/Linter.utils'

interface DisableRuleModalProps {
  lint: LintInfo
}

export const DisableRuleModal = ({ lint }: DisableRuleModalProps) => {
  const { ref } = useParams()
  const router = useRouter()
  const routeCategory = router.pathname.split('/').pop()

  const [open, setOpen] = useState(false)

  const { mutate: createRule, isLoading: isCreating } = useLintRuleCreateMutation({
    onSuccess: (_, vars) => {
      const ruleLint = vars.exception.lint_name
      const ruleLintMeta = lintInfoMap.find((x) => x.name === ruleLint)
      toast.success(`Successfully disabled the "${ruleLintMeta?.title}" rule`)

      if (ruleLintMeta) {
        if (!!routeCategory && routeCategory !== ruleLintMeta.category) {
          router.push(
            `/project/${ref}/advisors/rules/${ruleLintMeta.category}?lint=${ruleLintMeta.name}`
          )
        }
      }
      setOpen(false)
    },
  })

  const onCreateRule = () => {
    if (!ref) return console.error('Project ref is required')

    createRule({
      projectRef: ref,
      exception: {
        is_disabled: true,
        lint_category: undefined,
        lint_name: lint.name,
        assigned_to: undefined,
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="default">Disable rule</Button>
      </DialogTrigger>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>Confirm to disable rule</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          <p className="text-sm">
            This will silence the "{lint.title}" by hiding this rule in the Advisor reports, as well
            omitting this rule from email notifications for this project.
          </p>
        </DialogSection>
        <DialogFooter>
          <Button disabled={isCreating} type="default" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button loading={isCreating} type="primary" onClick={onCreateRule}>
            Disable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
