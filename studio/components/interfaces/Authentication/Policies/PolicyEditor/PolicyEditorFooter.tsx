import { FC } from 'react'
import { Button } from '@supabase/ui'

interface Props {
  showTemplates: boolean
  onViewTemplates: () => void
  onReviewPolicy: () => void
  onCancel: () => void
}

const PolicyEditorFooter: FC<Props> = ({
  showTemplates,
  onViewTemplates,
  onReviewPolicy,
  onCancel,
}) => (
  <div className="dark:border-dark flex items-center justify-between border-t px-6 py-4 mt-4">
    <Button type="default" onClick={onCancel}>
      Cancel
    </Button>

    <div className="flex items-center gap-2">
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
