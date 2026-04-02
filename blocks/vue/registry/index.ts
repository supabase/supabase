import { clients } from './clients'
import { dropzone } from './dropzone'
import { passwordBasedAuth } from './password-based-auth'
import { realtimeCursor } from './realtime-cursor'
import { socialAuth } from './social-auth'
import { currentUserAvatar } from './current-user-avatar'
import { realtimeAvatarStack } from './realtime-avatar-stack'
import { realtimeChat } from './realtime-chat'
import { infiniteQuery } from './infinite-query'

const blocks = [
  ...clients,
  ...passwordBasedAuth,
  ...socialAuth,
  ...dropzone,
  ...realtimeCursor,
  ...currentUserAvatar,
  ...realtimeAvatarStack,
  ...realtimeChat,
  ...infiniteQuery
]

export { blocks }
