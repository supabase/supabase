import authProviders from '../../data/authProviders'
import { withDocsBasePath } from '../internal-links'

export const AuthProviders = ({ props }: { props: Record<string, unknown> }): string => {
  const type = String(props.type ?? '')
  return authProviders
    .filter((p) => p.authType === type)
    .map((p) => `- [${p.name}](${withDocsBasePath(p.href)})`)
    .join('\n')
}
