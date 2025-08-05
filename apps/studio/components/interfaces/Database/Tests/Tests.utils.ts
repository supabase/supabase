export const isTestSuccessful = (result: any): boolean => {
  if (!result) return false

  const resultStr = JSON.stringify(result).toLowerCase()

  // Check for explicit failure indicators
  if (
    resultStr.includes('failed') ||
    resultStr.includes('error') ||
    resultStr.includes('exception') ||
    resultStr.includes('not ok') ||
    resultStr.includes('fail')
  ) {
    return false
  }

  // pgTAP specific success indicators
  if (
    resultStr.includes('all tests successful') ||
    resultStr.includes('ok') ||
    resultStr.includes('passed')
  ) {
    return true
  }

  // pg_regress specific success indicators
  if (resultStr.includes('test') && resultStr.includes('passed')) {
    return true
  }

  // If no explicit failure found and we have some result, consider it successful
  return true
}
