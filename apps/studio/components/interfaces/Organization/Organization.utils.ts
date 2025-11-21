// Invite is expired if older than 24hrs
export function isInviteExpired(timestamp: string) {
  const inviteDate = new Date(timestamp)
  const now = new Date()
  const timeBetween = now.valueOf() - inviteDate.valueOf()
  if (timeBetween / 1000 / 60 / 60 < 24) {
    return false
  }
  return true
}
