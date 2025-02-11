import { Code } from 'lucide-react'

const InlineEditorPreview = () => {
  return (
    <div className="space-y-2">
      <p className="text-sm text-foreground-light">
        The inline editor allows you to quickly edit SQL queries directly in the interface without
        opening a new tab or window. This feature streamlines your workflow by providing immediate
        access to query editing capabilities wherever you see SQL code.
      </p>
      <p className="text-sm text-foreground-light">
        You can access the inline editor by clicking the code editor icon in the top right corner of
        your dashboard.
      </p>
    </div>
  )
}

export default InlineEditorPreview
