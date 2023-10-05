export const navigateToSection = (key: string) => {
  if (typeof window !== 'undefined') {
    const el = document.getElementById(key)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }
}
