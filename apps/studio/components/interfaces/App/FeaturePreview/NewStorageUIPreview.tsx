export const NewStorageUIPreview = () => {
  return (
    <div>
      <p className="text-sm text-foreground-light mb-4">Add some nice description here</p>
      <p>Some nice image here</p>
      <div className="space-y-2 !mt-4">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>Specify what will happen</li>
        </ul>
      </div>
    </div>
  )
}
