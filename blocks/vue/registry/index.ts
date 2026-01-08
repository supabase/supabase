import { clients } from './clients'
import { passwordBasedAuth } from './password-based-auth'
import { socialAuth } from './social-auth'

const blocks = [...clients, ...passwordBasedAuth, ...socialAuth]

export { blocks }
