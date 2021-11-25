import { FC } from 'react'
import { Typography } from '@supabase/ui'

interface Props {
  input: string
  onInputChange: (event: any) => void
}

const SpreadSheetTextInput: FC<Props> = ({ input, onInputChange }) => (
  <>
    <Typography.Text>
      <p className="mb-3">
        Copy a table from a spreadsheet program such as Google Sheets or Excel and paste it in the
        field below. The first row should be the headers of the table, and your headers should not
        include any special characters other than hyphens (<Typography.Text code>-</Typography.Text>
        ) or underscores (<Typography.Text code>_</Typography.Text>).
      </p>
      <p className="text-sm opacity-50 mb-3">
        Tip: Datetime columns should be formatted as YYYY-MM-DD HH:mm:ss
      </p>
    </Typography.Text>
    <textarea
      className="font-mono w-full rounded-md bg-gray-700 text-white p-4 text-sm"
      rows={15}
      style={{ resize: 'none' }}
      value={input}
      onChange={onInputChange}
    ></textarea>
  </>
)

export default SpreadSheetTextInput
