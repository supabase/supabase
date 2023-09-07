import { noop } from 'lodash'
import { Button, IconExternalLink } from 'ui'

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
  <div className="flex justify-between items-center border-t px-6 py-4 dark:border-dark">
    <a
      href="https://supabase.com/docs/learn/auth-deep-dive/auth-policies"
      target="_blank"
      rel="noreferrer"
    >
      <Button type="link" icon={<IconExternalLink size={14} strokeWidth={1.5} />}>
        Documentation
      </Button>
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
