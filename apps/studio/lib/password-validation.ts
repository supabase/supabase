import { z } from 'zod'

export const passwordValidation = z
  .string()
  .min(1, 'Password is required')
  .max(72, 'Password cannot exceed 72 characters')
  .refine((password) => {
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};`':"\\|,.<>\/?]/.test(password)
    const isLongEnough = password.length >= 8

    return hasUppercase && hasLowercase && hasNumber && hasSpecialChar && isLongEnough
  }, 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character')
