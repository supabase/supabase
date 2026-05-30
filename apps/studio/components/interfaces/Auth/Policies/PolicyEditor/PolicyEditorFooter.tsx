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
      <Button type="default" onClick={onViewTemplates}>
        View templates
      </Button>
    )}
    <Button type="primary" onClick={onReviewPolicy}>
      Review
    </Button>
  </DialogFooter>
)

export default PolicyEditorFooter
