export const generateFeedbackMessage = (reasons: string[], message: string) => {
  return `
Exit survey \n

Reasons for leaving:
${reasons.reduce((a, b) => `${a}- ${b}\n`, '')}

Additional feedback:
${message}
  `
}
