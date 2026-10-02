import { getConfig } from '../../config'

const xForwardedHostRegExp = createXForwardedHostRegExp()

function createXForwardedHostRegExp(): RegExp | undefined {
  const { isMultitenant, requestXForwardedHostRegExp } = getConfig()
  if (!isMultitenant || !requestXForwardedHostRegExp) {
    return undefined
  }

  return new RegExp(requestXForwardedHostRegExp)
}

export function getXForwardedHostRegExp(): RegExp | undefined {
  return xForwardedHostRegExp
}
