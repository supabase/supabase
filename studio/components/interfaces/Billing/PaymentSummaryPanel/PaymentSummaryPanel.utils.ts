import { SubscriptionAddon } from '../AddOns/AddOns.types'

export const getPITRDays = (pitrAddon: SubscriptionAddon) => {
  const prodId = pitrAddon.metadata.supabase_prod_id
  const daysString = prodId.split('_')[2]
  return Number(daysString.split('days')[0])
}
