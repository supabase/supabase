import { ChangeEvent, KeyboardEvent } from 'react'
import { Input } from 'ui'

interface SpreadSheetTextInputProps {
  input: string
  onInputChange: (value: string) => void
}

const SpreadSheetTextInput = ({ input, onInputChange }: SpreadSheetTextInputProps) => {
  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(event.target.value)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Tab' && !event.shiftKey) {
      if (!input.endsWith('\t')) {
        event.preventDefault()
        onInputChange(input + '\t')
      }
    }
  }
  return (
    <div className="space-y-10">
      <div>
        <p className="mb-2 text-sm text-foreground-light">
          Copy a table from a spreadsheet program such as Google Sheets or Excel and paste it in the
          field below. The first row should be the headers of the table, and your headers should not
          include any special characters other than hyphens (<code>-</code>) or underscores (
          <code>_</code>).
        </p>
        <p className="text-sm text-foreground-lighter">
          Tip 1: Datetime columns should be formatted as YYYY-MM-DD HH:mm:ss
        </p>
        <p className="text-sm text-foreground-lighter">
          Tip 2: Press <kbd>Tab</kbd> 2 times to move focus to the next element
        </p>
      </div>
      <Input.TextArea
        size="tiny"
        className="font-mono"
        rows={15}
        style={{ resize: 'none' }}
        value={input}
        onKeyDown={handleKeyDown}
        onChange={handleInputChange}
      />
    </div>
  )
}

export default SpreadSheetTextInput
