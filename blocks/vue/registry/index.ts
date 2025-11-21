import { clients } from './clients'
import { passwordBasedAuth } from './password-based-auth'

const blocks = [...clients, ...passwordBasedAuth]

export { blocks }
