/*
 * Response Code
 *
 * for http response codes
 */

import { IconAlertCircle, IconInfo } from '@supabase/ui'

export const ResponseCodeFormatter = ({ value }: any) => {
  if (!value) {
    return (
      <div>
        <label className="text-xs text-scale-800">No data</label>
      </div>
    )
  }

  const split = value.toString().split('')[0]

  // console.log(split)

  switch (split) {
    // 2XX || 1XX responses
    case '1':
    case '2':
      return (
        <div className="flex items-center h-full">
          <div
            className="relative rounded px-2 py-1 text-center h-6 flex justify-center items-center
            bg-scale-300 dark:bg-scale-600
            
            "
          >
            <label className="block font-mono text-sm text-scale-900">{value}</label>
          </div>
        </div>
      )
      break
    // 5XX responses
    case '5':
      return (
        <div className="flex items-center h-full">
          <div
            className="relative rounded px-2 py-1 text-center h-6 flex justify-center items-center
            bg-red-400
            
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
        <div className="flex items-center h-full">
          <div
            className="relative rounded px-2 py-1 text-center h-6 flex justify-center items-center
            bg-amber-400
            
            "
          >
            <label className="block font-mono text-sm text-amber-1100 dark:text-amber-900">
              {value}
            </label>
          </div>
        </div>
      )
      break
    // All other responses
    default:
      return (
        <div className="flex items-center h-full">
          <div
            className="relative rounded px-2 py-1 text-center h-6 flex justify-center items-center
            bg-scale-300
            
            "
          >
            <label className="block font-mono text-sm text-scale-900">{value}</label>
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

export const SeverityFormatter = ({ value }: { value: string }) => {
  if (!value) {
    return (
      <div>
        <label className="text-xs text-scale-800">No data</label>
      </div>
    )
  }

  value = value.toLowerCase()

  switch (value) {
    case 'error':
      return (
        <div className="flex items-center h-full gap-1">
          <div className=" p-0.5 rounded !text-red-900">
            <IconAlertCircle size={14} strokeWidth={2} />
          </div>
          <span className="!text-red-900 !block titlecase">{value}</span>
        </div>
      )
      break

    case 'info':

    case 'debug':
      return (
        <div className="flex items-center h-full gap-1">
          <div className=" p-0.5 rounded !text-blue-900">
            <IconAlertCircle size={14} strokeWidth={2} />
          </div>
          <span className="!text-blue-900 !block titlecase">{value}</span>
        </div>
      )
      break

    case 'log':
      return (
        <div className="flex items-center h-full gap-1">
          <div className=" p-0.5 rounded !text-blue-900">
            <IconInfo size={14} strokeWidth={2} />
          </div>
          <span className="!text-blue-900 !block titlecase">{value}</span>
        </div>
      )
      break

    // All other responses
    default:
      return (
        <div className="flex items-center h-full">
          <div
            className="relative rounded px-2 py-1 text-center h-6 flex justify-center items-center
            bg-scale-300
            
            "
          >
            <label className="block font-mono text-sm text-scale-900">{value}</label>
          </div>
        </div>
      )
      break
  }
}

/*
 * Header Formatter
 *
 * for http response codes
 */

export const HeaderFormmater = ({ value }: any) => {
  return <div className="text-scale-900 font-normal flex items-center text-xs h-full">{value}</div>
}

/*
 * JSON Syntax Highlighter
 *
 * for http response codes
 */

export function jsonSyntaxHighlight(json: string) {
  json = JSON.stringify(json, null, 2)
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // console.log('json', json)
  const newJson = json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,

    function (match) {
      var cls = 'number text-tomato-900'
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key text-scale-1200'
        } else {
          cls = 'string text-brand-1100'
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
