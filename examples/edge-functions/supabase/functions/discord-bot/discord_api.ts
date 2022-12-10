const DISCORD_API_URL = 'https://discord.com/api/v9'

const headers = {
  Authorization: `Bot ${Deno.env.get('DISCORD_BOT_TOKEN')!}`,
  'Content-Type': 'application/json',
}

export const sendDiscordDM = async ({
  user,
  message,
}: {
  user: string
  message: string
}): Promise<void> => {
  // Open DM channel
  const createDMChannel = await fetch(`${DISCORD_API_URL}/users/@me/channels`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ recipient_id: user }),
  }).then((res) => res.json())
  console.log(createDMChannel)
  // Send DM
  const createDM = await fetch(`${DISCORD_API_URL}/channels/${createDMChannel.id}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content: message }),
  }).then((res) => res.json())
  console.log(createDM)
}

export const createPrivateThread = async ({
  channel,
  user,
  username,
  message,
}: {
  channel: string
  user: string
  username: string
  message: string
}): Promise<void> => {
  // Create private thread
  const createDMChannel = await fetch(`${DISCORD_API_URL}/channels/${channel}/threads`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: `${username}'s challenge. Complete your submission`,
      type: 12,
      invitable: false,
    }),
  }).then((res) => res.json())
  console.log(createDMChannel)
  // Add user to thread
  const addUser = await fetch(
    `${DISCORD_API_URL}/channels/${createDMChannel.id}/thread-members/${user}`,
    {
      method: 'PUT',
      headers,
    }
  )
  console.log(addUser)
  // Send message to thread
  const createDM = await fetch(`${DISCORD_API_URL}/channels/${createDMChannel.id}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content: message }),
  }).then((res) => res.json())
  console.log(createDM)
  // Add webhook
  const createWebhook = await fetch(`${DISCORD_API_URL}/channels/${createDMChannel.id}/webhooks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: `${username}_webhook` }),
  }).then((res) => res.json())
  console.log(createWebhook)
}
