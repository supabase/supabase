import { clients } from './clients'
import { dropzone } from './dropzone'
import { passwordBasedAuth } from './password-based-auth'
import { socialAuth } from './social-auth'


const blocks = [...clients, ...passwordBasedAuth, ...socialAuth, ...dropzone]

export { blocks }
