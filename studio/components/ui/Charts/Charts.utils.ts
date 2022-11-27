
/**
 * Auto formats a number to a default precision if it is a float
 * 
 * @example
 * numberFormatter(123)       // "123"
 * numberFormatter(123.123)   // "123.12"
 * numberFormatter(123, 2)    // "123.00"
 */
export const numberFormatter = (num: number, precision = 2) => isFloat(num) ? precisionFormatter(num, precision) : String(num);


/**
 * Tests if a number is a float.
 * 
 * @example
 * isFloat(123)     // false
 * isFloat(123.123)     // true
 */
export const isFloat = (num: number) => String(num).includes(".")


/**
 * Formats a number to a particular precision.
 * 
 * @example
 * precisionFormatter(123, 2)       // "123.00"
 * precisionFormatter(123.123, 2)   // "123.12"
 */
export const precisionFormatter = (num: number, precision: number): string => {
  if (isFloat(num)) {
    const [head, tail] = String(num).split(".")
    return head + "." + tail.slice(0, precision)
  } else {
    // pad int with 0
    return String(num) + "." + ("0".repeat(precision))
  }
}