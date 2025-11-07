import generator from 'generate-password-browser'

export const generateStrongPassword = () => {
  const password = generator.generate({
    length: 16,
    numbers: true,
    uppercase: true,
  })
  return password
}
