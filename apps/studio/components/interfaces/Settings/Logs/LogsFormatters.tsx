/*
 * Response Code
 *
 * for http response codes
 */

import CopyButton from 'components/ui/CopyButton'
import React from 'react'
import { isUnixMicro, unixMicroToIsoTimestamp } from './Logs.utils'
import { AlertCircle, Info } from 'lucide-react'
import dayjs from 'dayjs'

export const RowLayout: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="flex h-full w-full items-center gap-4">{children}</div>
)
// renders a timestamp (either unix microsecond or iso timestamp)
export const SelectionDetailedTimestampRow = ({ value }: { value: string | number }) => (
  <SelectionDetailedRow
    label="Timestamp"
    value={isUnixMicro(value) ? unixMicroToIsoTimestamp(value) : String(value)}
  />
)
export const SelectionDetailedRow = ({
  label,
  value,
  valueRender,
}: {
  label: string
  value: string
  valueRender?: React.ReactNode
}) => {
  return (
    <div className="group flex items-center gap-2 flex-wrap">
      <span className="text-foreground-lighter text-sm col-span-3 whitespace-pre-wrap">
        {label}
      </span>
      <span
        title={value}
        className="truncate font-mono text-foreground text-sm whitespace-pre-wrap break-all"
      >
        {valueRender ?? value}
      </span>
      <CopyButton
        iconOnly
        text={value}
        className="group-hover:opacity-100 opacity-0 p-0 h-6 w-6"
        type="text"
        title="Copy to clipboard"
      />
    </div>
  )
}

// used for column renderers
export const TextFormatter: React.FC<{ className?: string; value: string }> = ({
  value,
  className,
}) => <span className={'font-mono text-xs truncate ' + className}>{value}</span>

export const ResponseCodeFormatter = ({ value }: any) => {
  if (!value) {
    return (
      <div>
        <label className="text-xs text-border-stronger">No data</label>
      </div>
    )
  }

  const split = value.toString().split('')[0]

  switch (split) {
    // 2XX || 1XX responses
    case '1':
    case '2':
      return (
        <div className="flex h-full items-center">
          <div className="relative flex h-6 items-center justify-center rounded border bg-surface-200 px-2 py-1 text-center">
            <label className="block font-mono text-sm text-foreground-lighter">{value}</label>
          </div>
        </div>
      )
      break
    // 5XX responses
    case '5':
      return (
        <div className="flex h-full items-center">
          <div
            className="relative flex h-6 items-center justify-center rounded bg-red-400 px-2 py-1
            text-center

            "
          >
            <label className="block font-mono text-sm text-red-1100">{value}</label>
          </div>
        </div>
      )
      break
    // 4XX || 3XX responses
    case '4':
    case '3':
      return (
        <div className="flex h-full items-center">
          <div
            className="relative flex h-6 items-center justify-center rounded bg-amber-400 px-2 py-1
            text-center

            "
          >
            <label className="block font-mono text-sm text-amber-1100">{value}</label>
          </div>
        </div>
      )
      break
    // All other responses
    default:
      return (
        <div className="flex h-full items-center">
          <div
            className="relative flex h-6 items-center justify-center rounded bg-surface-100 px-2 py-1
            text-center

            "
          >
            <label className="block font-mono text-sm text-foreground-lighter">{value}</label>
          </div>
        </div>
      )
      break
  }
}

/*
 * Response Code
 *
 * for http response codes
 */

export const SeverityFormatter = ({
  value,
  uppercase = true,
}: {
  value: string
  uppercase?: boolean
}) => {
  if (!value) {
    return (
      <div>
        <label className="text-xs text-border-stronger">No data</label>
      </div>
    )
  }

  const uppercasedValue = value.toUpperCase()
  const text = uppercase ? uppercasedValue : value
  const Layout: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
    className,
    children,
  }) => <div className={`w-24 flex items-center h-full ${className}`}>{children}</div>

  switch (uppercasedValue) {
    case 'UNCAUGHTEXCEPTION':
    case 'PANIC':
    case 'FATAL':
    case 'ERROR':
      return (
        <Layout className="gap-1">
          <div className=" p-0.5 rounded !text-red-900">
            <AlertCircle size={14} strokeWidth={2} />
          </div>
          <span className="!text-red-900 !block titlecase">{text}</span>
        </Layout>
      )
      break

    case 'INFO':

    case 'DEBUG':
      return (
        <Layout className="gap-1">
          <div className=" p-0.5 rounded !text-blue-900">
            <AlertCircle size={14} strokeWidth={2} />
          </div>
          <span className="!text-blue-900 !block titlecase">{text}</span>
        </Layout>
      )
      break

    case 'LOG':
      return (
        <Layout className="gap-1">
          <div className=" p-0.5 rounded !text-blue-900">
            <Info size={14} strokeWidth={2} />
          </div>
          <span className="!text-blue-900 !block titlecase">{text}</span>
        </Layout>
      )
      break

    case 'WARNING':
      return (
        <Layout className="gap-1">
          <div className=" p-0.5 rounded !text-amber-900">
            <AlertCircle size={14} strokeWidth={2} />
          </div>
          <span className="!text-amber-900 !block titlecase">{text}</span>
        </Layout>
      )
      break

    // All other responses
    default:
      return (
        <Layout>
          <div className="relative rounded px-2 py-1 text-center h-6 flex justify-center items-center bg-surface-100">
            <label className="block font-mono text-sm text-foreground-lighter">{text}</label>
          </div>
        </Layout>
      )
      break
  }
}

export const timestampLocalFormatter = (value: string | number) => {
  const timestamp = isUnixMicro(value) ? unixMicroToIsoTimestamp(value) : value
  return dayjs(timestamp).format('DD MMM  HH:mm:ss')
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
          cls = 'key text-foreground'
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
