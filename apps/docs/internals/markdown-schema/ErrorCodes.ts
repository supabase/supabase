import authErrorCodes from '../../data/errorCodes/authErrorCodes.json'
import realtimeErrorCodes from '../../data/errorCodes/realtimeErrorCodes.json'
import { type ErrorCodeDefinition } from '../../resources/error/errorTypes'

const errorCodesByService: Record<string, Record<string, ErrorCodeDefinition>> = {
  auth: authErrorCodes as Record<string, ErrorCodeDefinition>,
  realtime: realtimeErrorCodes as Record<string, ErrorCodeDefinition>,
}

// Pipes break the surrounding table layout, so escape any that appear in cell text.
const escapeCell = (value: string): string => value.replace(/\|/g, '\\|')

export const ErrorCodes = ({ props }: { props: Record<string, unknown> }): string => {
  const service = String(props.service ?? '')
  const errorCodes = errorCodesByService[service]
  if (!errorCodes) return ''

  const entries = Object.entries(errorCodes).sort(([aCode], [bCode]) => aCode.localeCompare(bCode))
  const hasResolutions = entries.some(([, definition]) => definition.resolution)

  const headings = ['Error code', 'Description', ...(hasResolutions ? ['Action'] : [])]
  const headerRow = `| ${headings.join(' | ')} |`
  const dividerRow = `| ${headings.map(() => '---').join(' | ')} |`

  const rows = entries.map(([code, definition]) => {
    let description = escapeCell(definition.description)
    if (definition.references?.length) {
      const links = definition.references
        .map((reference) => `[${escapeCell(reference.description)}](${reference.href})`)
        .join(', ')
      description += ` Learn more: ${links}`
    }

    const cells = [`\`${code}\``, description]
    if (hasResolutions) {
      cells.push(definition.resolution ? escapeCell(definition.resolution) : '')
    }
    return `| ${cells.join(' | ')} |`
  })

  return [headerRow, dividerRow, ...rows].join('\n')
}
