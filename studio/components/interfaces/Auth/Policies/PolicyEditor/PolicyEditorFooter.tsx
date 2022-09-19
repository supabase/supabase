import { FC } from 'react'
import { Button } from 'ui'

interface Props {
  showTemplates: boolean
  onViewTemplates: () => void
  onReviewPolicy: () => void
}

const PolicyEditorFooter: FC<Props> = ({ showTemplates, onViewTemplates, onReviewPolicy }) => (
  <div className="flex w-full items-center justify-end gap-2 border-t px-6 py-4 dark:border-dark">
    {showTemplates && (
      <Button type="default" onClick={onViewTemplates}>
        View templates
      </Button>
    )}
    <Button type="primary" onClick={onReviewPolicy}>
      Review
    </Button>
  </div>
)

export default PolicyEditorFooter
