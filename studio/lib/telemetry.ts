import { post } from 'lib/common/fetch'
import { API_URL, IS_PLATFORM } from 'lib/constants'
import { User } from 'types'

const sendEvent = (category: string, action: string, label: string, value?: string) => {
  if (!IS_PLATFORM) return

  return post(`${API_URL}/telemetry/event`, {
    action: action,
    category: category,
    label: label,
    value: value,
  })
}

const sendIdentify = (user: User) => {
  if (!IS_PLATFORM) return

  return post(`${API_URL}/telemetry/identify`, { user })
}

export default {
  sendEvent,
  sendIdentify,
}
