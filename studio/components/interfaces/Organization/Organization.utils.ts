// Invite is expired if older than 24hrs
export function isInviteExpired(timestamp: Date) {
  const inviteDate = new Date(timestamp)
  const now = new Date()
  var timeBetween = now.valueOf() - inviteDate.valueOf()
  if (timeBetween / 1000 / 60 / 60 < 24) {
    return false
  }
  return true
}
