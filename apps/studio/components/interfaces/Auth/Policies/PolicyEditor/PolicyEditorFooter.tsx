import { noop } from 'lodash'
import { Button } from 'ui'

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
  <div className="flex justify-between items-center border-t px-6 py-4 border-default">
    <div className="flex w-full items-center justify-end gap-2">
      {showTemplates && (
        <Button type="default" onClick={onViewTemplates}>
          View templates
        </Button>
      )}
      <Button type="primary" onClick={onReviewPolicy}>
        Review
      </Button>
    </div>
  </div>
)

export default PolicyEditorFooter
