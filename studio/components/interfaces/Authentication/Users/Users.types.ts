export interface User {
  id: string
  email: string
  phone: string
  email_confirmed_at: string
  phone_confirmed_at: string
  created_at: string
  last_sign_in_at: string
  raw_app_meta_data?: {
    provider: string
  }
  app_metadata?: {
    provider: string
  }
}
