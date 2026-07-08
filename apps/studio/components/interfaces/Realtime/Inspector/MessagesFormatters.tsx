import { PropsWithChildren } from 'react'

import { unixMicroToIsoTimestamp } from './Messages.utils'
import CopyButton from '@/components/ui/CopyButton'

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
          variant="text"
          title="Copy to clipboard"
        />
      )}
    </div>
  )
}

export function isBinaryPayload(value: unknown): value is ArrayBuffer | ArrayBufferView {
  return value instanceof ArrayBuffer || ArrayBuffer.isView(value)
}

export function withBinaryPayloadPlaceholder<T>(metadata: T): T {
  const record = metadata as Record<string, unknown> | null | undefined
  const payload = record?.payload
  if (!isBinaryPayload(payload)) return metadata
  return {
    ...(record as Record<string, unknown>),
    payload: `<binary, ${payload.byteLength} bytes>`,
  } as T
}

export function formatHexdump(buffer: ArrayBuffer | ArrayBufferView): string {
  const bytes =
    buffer instanceof ArrayBuffer
      ? new Uint8Array(buffer)
      : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)

  const GROUP_WIDTH = 8 * 3 - 1 // 8 bytes * "xx " minus trailing space
  const lines: string[] = []

  for (let offset = 0; offset < bytes.length; offset += 16) {
    const chunk = bytes.subarray(offset, offset + 16)
    const hex = Array.from(chunk, (b) => b.toString(16).padStart(2, '0'))
    const first = hex.slice(0, 8).join(' ').padEnd(GROUP_WIDTH, ' ')
    const second = hex.slice(8, 16).join(' ').padEnd(GROUP_WIDTH, ' ')
    const ascii = Array.from(chunk, (b) =>
      b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '.'
    ).join('')
    const offsetStr = offset.toString(16).padStart(8, '0')
    lines.push(`${offsetStr}  ${first}  ${second}  |${ascii}|`)
  }

  return lines.join('\n')
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
