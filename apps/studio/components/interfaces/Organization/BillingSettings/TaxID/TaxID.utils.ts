/** Ignore id property amongst tax ids */
export const checkTaxIdEqual = (a: any, b: any) => {
  return a?.type === b?.type && a?.value === b?.value
}
