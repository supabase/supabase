/**
 *
 * @param result The response of the pgtap test case
 * @returns boolean (False is operation cannot be done successfully)
 *
 * Because the tests written with pgtap tests for negative results. e.g "ok" if operation cannot be conducted.
 * To understand this easily through the dashboard, we return false if operation cannot be conducted, and true
 * otherwise.
 */
export const inferTestResult = (result: { [key: string]: string }) => {
  const key = Object.keys(result)[0]
  // For errors
  if (key === 'finish' && result[key].includes('failed')) return true
  // For insert
  else if (key === 'throws_ok' && result[key].includes('ok 1')) return false
  // For update, delete, and select
  else if (key === 'is_empty') return undefined
  return undefined
}
