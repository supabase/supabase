import { Session, SupabaseClient } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

export type TicketState = 'registration' | 'ticket' | 'loading' | 'game'

export type UserData = {
  id?: string
  email?: string
  username?: string
  name?: string
  ticket_number?: number
  platinum?: boolean
  golden?: boolean
  referrals?: number
  bg_image_id?: number
  role?: string
  company?: string
  location?: string
  metadata?: {
    role?: string
    company?: string
    location?: string
    hasSecretTicket?: boolean
    hasSharedSecret?: boolean
    hideAvatar?: boolean
    hideMetadata?: boolean
    theme?: string
  }
  shared_on_twitter?: string
  shared_on_linkedin?: string
  secret?: boolean
}

type ConfDataContextType = {
  supabase: SupabaseClient | null
  session: Session | null
  userData: UserData
  setUserData: React.Dispatch<React.SetStateAction<UserData>>
  ticketState: TicketState
  setTicketState: React.Dispatch<React.SetStateAction<TicketState>>
  showCustomizationForm?: boolean
  setShowCustomizationForm?: React.Dispatch<React.SetStateAction<boolean>>
}

export const ConfDataContext = createContext<ConfDataContextType | null>(null)

export default function useConfData() {
  const result = useContext(ConfDataContext)
  if (!result) {
    throw new Error()
  }
  return result
}
