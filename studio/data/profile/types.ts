export type Profile = {
  id: number
  auth0_id: string
  primary_email: string
  username: string
  first_name: string
  last_name: string
  mobile: string | null
  is_alpha_user: boolean
  gotrue_id: string
  free_project_limit: number
}
