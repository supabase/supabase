import { FC } from 'react'
import { Button } from '@supabase/ui'

interface Props {
  showTemplates: boolean
  onViewTemplates: () => void
  onReviewPolicy: () => void
}

const PolicyEditorFooter: FC<Props> = ({ showTemplates, onViewTemplates, onReviewPolicy }) => (
  <div className="dark:border-dark flex w-full items-center justify-end gap-2 border-t px-6 py-4">
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
