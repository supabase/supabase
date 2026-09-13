import { metricsStackOptions } from '../../components/MetricsStackCards.data'
import { withDocsBasePath } from '../internal-links'

export const MetricsStackCards = (): string =>
  metricsStackOptions
    .map(
      ({ title, description, href }) => `- [${title}](${withDocsBasePath(href)}). ${description}`
    )
    .join('\n')
