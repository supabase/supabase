/**
 * Simulates a custom webpack asset/resource loader we use in Next.js/webpack
 */
export function load(url, context, nextLoad) {
  if (url.endsWith('?resource')) {
    // Simply return the same URL for testing purposes
    return {
      format: 'module',
      shortCircuit: true,
      source: `export default ${JSON.stringify(url)}`,
    }
  }

  // Otherwise let Node.js handle the import
  return nextLoad(url)
}
