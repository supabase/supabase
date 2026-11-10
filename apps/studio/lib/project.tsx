import { generateRandomString } from '@/lib/random'

const PASSWORD_CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export const generateStrongPassword = () => generateRandomString(16, PASSWORD_CHARSET)
