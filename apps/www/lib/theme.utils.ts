export function handleForceDeepDark(isDarkTheme: boolean) {
  const handleDocumentLoad = () => {
    // Update the HTML element attributes

    const theme = isDarkTheme ? 'deep-dark' : 'light'

    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme

    // wait 1 second before setting the theme
    setTimeout(() => {
      document.documentElement.setAttribute('data-theme', theme)
      document.documentElement.style.colorScheme = theme
    }, 200)

    // Clean up the event listener
    window.removeEventListener('load', handleDocumentLoad)
  }

  // Check if document is already loaded
  if (document.readyState === 'complete') {
    handleDocumentLoad()
  } else {
    // Add a global load event listener
    window.addEventListener('load', handleDocumentLoad)
  }

  // Clean up the event listener on component unmount
  return () => {
    window.removeEventListener('load', handleDocumentLoad)
  }
}
