import { noop } from 'lodash'
import { Button, DialogFooter } from 'ui'

interface PolicyEditorFooterProps {
  showTemplates: boolean
  onViewTemplates: () => void
  onReviewPolicy: () => void
}

const PolicyEditorFooter = ({
  showTemplates,
  onViewTemplates = noop,
  onReviewPolicy = noop,
}: PolicyEditorFooterProps) => (
  <DialogFooter>
    {showTemplates && (
      <Button variant="default" onClick={onViewTemplates}>
        View templates
      </Button>
    )}
    <Button variant="primary" onClick={onReviewPolicy}>
      Review
    </Button>
  </DialogFooter>
)

export default PolicyEditorFooter
