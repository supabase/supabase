export const navigateToSection = (key: string) => {
  if (typeof window !== 'undefined') {
    const el = document.getElementById(key)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }
}

// Removes some auto-generated Postgrest text
// Ideally PostgREST wouldn't add this if there is already a comment
export const tempRemovePostgrestText = (content: string) => {
  const postgrestTextPk = `Note:\nThis is a Primary Key.<pk/>`
  const postgrestTextFk = `Note:\nThis is a Foreign Key to`
  const pkTextPos = content.lastIndexOf(postgrestTextPk)
  const fkTextPos = content.lastIndexOf(postgrestTextFk)

  let cleansed = content
  if (pkTextPos >= 0) cleansed = cleansed.substring(0, pkTextPos)
  if (fkTextPos >= 0) cleansed = cleansed.substring(0, fkTextPos)
  return cleansed
}
