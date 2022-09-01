
/**
 * Converts a query params string to an object
 */
export const queryParamsToObject = (params: string) => {
    return Object.fromEntries(new URLSearchParams(params))
}