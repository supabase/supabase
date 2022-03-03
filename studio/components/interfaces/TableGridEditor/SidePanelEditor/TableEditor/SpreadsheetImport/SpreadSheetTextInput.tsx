import { FC } from 'react'
import { Input, Typography } from '@supabase/ui'

interface Props {
  input: string
  onInputChange: (event: any) => void
}

const SpreadSheetTextInput: FC<Props> = ({ input, onInputChange }) => (
  <div className="space-y-10">
    <div>
      <p className="text-sm text-scale-1100 mb-2">
        Copy a table from a spreadsheet program such as Google Sheets or Excel and paste it in the
        field below. The first row should be the headers of the table, and your headers should not
        include any special characters other than hyphens (<Typography.Text code>-</Typography.Text>
        ) or underscores (<Typography.Text code>_</Typography.Text>).
      </p>
      <p className="text-xs text-scale-900">
        Tip: Datetime columns should be formatted as YYYY-MM-DD HH:mm:ss
      </p>
    </div>
    <Input.TextArea
      size="tiny"
      className="font-mono"
      rows={15}
      style={{ resize: 'none' }}
      value={input}
      onChange={onInputChange}
    />
  </div>
)

export default SpreadSheetTextInput
