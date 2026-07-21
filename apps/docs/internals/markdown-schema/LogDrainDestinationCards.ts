import { logDrainDestinationOptions } from '../../components/LogDrainDestinationCards.data'
import { withDocsBasePath } from '../internal-links'

export const LogDrainDestinationCards = (): string =>
  logDrainDestinationOptions
    .map(
      ({ title, description, href }) => `- [${title}](${withDocsBasePath(href)}). ${description}`
    )
    .join('\n')
