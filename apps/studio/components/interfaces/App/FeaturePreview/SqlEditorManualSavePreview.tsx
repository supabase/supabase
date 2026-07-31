export const SqlEditorManualSavePreview = () => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground-light">
        Switch the SQL Editor from autosaving every edit to saving only when you ask it to.
      </p>
      <div className="space-y-2">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>Stop auto-saving snippet edits as you type</li>
          <li>Add a Save button next to Run in the SQL Editor toolbar</li>
          <li>Let you save with Cmd+S at any time</li>
        </ul>
      </div>
    </div>
  )
}
