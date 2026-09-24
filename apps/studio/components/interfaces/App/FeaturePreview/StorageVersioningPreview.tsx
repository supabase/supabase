export const StorageVersioningPreview = () => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground-light">
        Keep previous copies of a file when it's overwritten or deleted, and set a lifecycle policy
        that expires them automatically.
      </p>
      <div className="space-y-2">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>Add object versioning and lifecycle policy settings to the bucket settings</li>
          <li>Show a version history for each file in the file preview panel</li>
          <li>Allow soft-deleting and restoring files</li>
          <li>Break down retained version storage on the organization usage page</li>
        </ul>
      </div>
      <p className="text-sm text-foreground-light">
        Versioning is in <em>Private Alpha</em> and is off for every bucket by default until you
        turn it on.
      </p>
    </div>
  )
}
