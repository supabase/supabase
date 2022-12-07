export interface DiscordWebhookEvent {
  app_permissions: string
  application_id: string
  channel_id: string
  data: {
    id: string
    name: string
    options: Array<{
      name: string
      type: number
      options: Array<{
        name: string
        type: number
        value: string
      }>
    }>
    type: number
  }
  entitlement_sku_ids: string[]
  guild_id: string
  guild_locale: string
  id: string
  locale: string
  member: {
    avatar: string | null
    communication_disabled_until: string
    deaf: boolean
    flags: number
    is_pending: boolean
    joined_at: string
    mute: boolean
    nick: string | null
    pending: boolean
    permissions: string
    premium_since: string | null
    roles: string[]
    user: {
      avatar: string
      avatar_decoration: string | null
      discriminator: string
      id: string
      public_flags: number
      username: string
    }
  }
  token: string
  type: number
  version: number
}
