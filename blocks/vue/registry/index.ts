import { clients } from './clients'
import { currentUserAvatar } from './current-user-avatar'
import { dropzone } from './dropzone'
import { infiniteQuery } from './infinite-query'
import { passwordBasedAuth } from './password-based-auth'
import { realtimeAvatarStack } from './realtime-avatar-stack'
import { realtimeChat } from './realtime-chat'
import { realtimeCursor } from './realtime-cursor'
import { socialAuth } from './social-auth'

const blocks = [
  ...clients,
  ...passwordBasedAuth,
  ...socialAuth,
  ...dropzone,
  ...realtimeCursor,
  ...currentUserAvatar,
  ...realtimeAvatarStack,
  ...realtimeChat,
  ...infiniteQuery,
]

export { blocks }
