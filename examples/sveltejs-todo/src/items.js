export const items = () => {
  try {
    return JSON.parse(localStorage.getItem('todos-svelte')) || []
  } catch (err) {
    return []
  }
}
