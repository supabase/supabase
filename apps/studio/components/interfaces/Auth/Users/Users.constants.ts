import { BASE_PATH } from 'lib/constants'
import { PROVIDER_PHONE, PROVIDERS_SCHEMAS } from '../AuthProvidersFormValidation'

export const PROVIDER_FILTER_OPTIONS = PROVIDERS_SCHEMAS.map((provider) => ({
  name: provider.title,
  value:
    provider.title === 'Slack (OIDC)'
      ? 'slack_oidc'
      : provider.title === 'LinkedIn (OIDC)'
        ? 'linkedin_oidc'
        : provider.title.toLowerCase(),
  icon: `${BASE_PATH}/img/icons/${provider.misc.iconKey}.svg`,
  iconClass: provider.title === 'GitHub' ? 'dark:invert' : '',
})).concat(
  PROVIDER_PHONE.properties.SMS_PROVIDER.enum.map((x) => ({
    name: x.label,
    value: x.value,
    icon: `${BASE_PATH}/img/icons/${x.icon}`,
    iconClass: '',
  }))
)
