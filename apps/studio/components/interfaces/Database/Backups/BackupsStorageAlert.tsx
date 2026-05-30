import { Admonition } from 'ui-patterns/admonition'

export const BackupsStorageAlert = () => {
  return (
    <Admonition
      type="default"
      layout="horizontal"
      title="Storage objects are not included"
      description="Database backups do not include objects stored via the Storage API, as the database only
        includes metadata about these objects. Restoring an old backup does not restore objects that
        have been deleted since then."
    />
  )
}
