import { FC } from 'react'
import { Button, IconExternalLink } from 'ui'

interface Props {
  showTemplates: boolean
  onViewTemplates: () => void
  onReviewPolicy: () => void
}

const PolicyEditorFooter: FC<Props> = ({ showTemplates, onViewTemplates, onReviewPolicy }) => (
  <div className="flex justify-between items-center border-t px-6 py-4 dark:border-dark">
    <a href='https://supabase.com/docs/learn/auth-deep-dive/auth-policies' target="_blank">
      <Button type='link' icon={<IconExternalLink size={14} strokeWidth={1.5} />}>Documentation</Button>
    </a>
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
