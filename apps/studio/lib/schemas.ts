import * as yup from 'yup'
import YupPassword from 'yup-password'

// extend yup with password validation
YupPassword(yup)

export const passwordSchema = yup.object({
  password: yup
    .string()
    .password()
    .required()
    .max(72, 'Password cannot exceed 72 characters')
    .label('Password'),
})
