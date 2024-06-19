import { PropsWithChildren } from 'react'

import CopyButton from 'components/ui/CopyButton'
import { unixMicroToIsoTimestamp } from './Messages.utils'

export const RowLayout = ({ children }: PropsWithChildren<{}>) => (
  <div className="flex h-full w-full items-center gap-4">{children}</div>
)
// renders a timestamp (either unix microsecond or iso timestamp)
export const SelectionDetailedTimestampRow = ({
  value,
  hideCopy = false,
}: {
  value: string | number
  hideCopy?: boolean
}) => (
  <SelectionDetailedRow
    label="Timestamp"
    value={unixMicroToIsoTimestamp(value)}
    hideCopy={hideCopy}
  />
)
export const SelectionDetailedRow = ({
  label,
  value,
  valueRender,
  hideCopy = false,
}: {
  label: string
  value: string
  valueRender?: React.ReactNode
  hideCopy?: boolean
}) => {
  return (
    <div className="grid grid-cols-12 group">
      <span className="text-scale-900 text-sm col-span-4 whitespace-pre-wrap">{label}</span>
      <span className="text-scale-1200 text-sm col-span-6 whitespace-pre-wrap break-all">
        {valueRender ?? value}
      </span>
      {!hideCopy && (
        <CopyButton
          text={value}
          className="group-hover:opacity-100 opacity-0 my-auto transition col-span-2  h-4 w-4 px-0 py-0"
          type="text"
          title="Copy to clipboard"
        />
      )}
    </div>
  )
}

/*
 * JSON Syntax Highlighter
 *
 * for http response codes
 */
export function jsonSyntaxHighlight(input: Object) {
  let json: string = JSON.stringify(input, null, 2)
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const newJson = json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,

    function (match) {
      var cls = 'number text-tomato-900'
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key text-scale-1200'
        } else {
          cls = 'string text-brand-600'
        }
      } else if (/true|false/.test(match)) {
        cls = 'boolean text-blue-900'
      } else if (/null/.test(match)) {
        cls = 'null text-amber-1100'
      }
      return '<span class="' + cls + '">' + match + '</span>'
    }
  )

  const jsonWithLineWraps = newJson.split(`\n`).map((x) => {
    return `<span class="line text-xs">${x}</span>`
  })

  return jsonWithLineWraps.join('\n')
}
