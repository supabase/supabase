// Codes are 4 groups of alphanumeric characters
const CodeRegex = new RegExp('([a-zA-Z0-9]{4})([a-zA-Z0-9]{4})([a-zA-Z0-9]{4})([a-zA-Z0-9]{4})')

/*
 * Format recovery code to make it easier to read by humans by separating the 4 groups of alphanumeric characters by a
 * dash and transforming them to uppercase
 */
export const formatRecoveryCode = (code: string) => {
  if (code.length !== 16) return code
  return code.toUpperCase().replace(CodeRegex, '$1-$2-$3-$4')
}
