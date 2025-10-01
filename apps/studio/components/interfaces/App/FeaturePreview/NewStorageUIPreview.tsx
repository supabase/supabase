import { BASE_PATH } from 'lib/constants'
import Image from 'next/image'

export const NewStorageUIPreview = () => {
  return (
    <div className="text-sm text-foreground-light">
      <p className=" mb-4">
        Experience our enhanced Storage interface with support for analytics and vector bucket
        types.
      </p>
      <Image
        alt="new-storage-preview"
        src={`${BASE_PATH}/img/previews/new-storage-preview.png`}
        width={1160}
        height={658}
        className="rounded border mb-4"
      />
      <div className="space-y-2 !mt-4">
        <p>Enabling this preview will:</p>
        <ul className="list-disc pl-6  space-y-1">
          <li>Move Storage buckets from the sidebar into the main content area</li>
          <li>Change the role of the sidebar to a bucket type selector</li>
          <li>Nest settings and policies under their respective bucket types</li>
        </ul>
        <p>
          These changes are necessary to support incoming analytics and vector bucket types. File
          storage will remain the default, and be shown by default when entering Storage.
        </p>
      </div>
    </div>
  )
}
