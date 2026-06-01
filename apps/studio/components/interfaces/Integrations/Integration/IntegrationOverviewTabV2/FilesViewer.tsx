import { Image } from 'ui-patterns/Image'

export const FilesViewer = ({ files }: { files: string[] }) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {files.map((file) => (
        <Image
          key={file}
          src={file}
          alt=""
          zoomable
          width={400}
          height={225}
          className="rounded-md border object-cover w-full"
        />
      ))}
    </div>
  )
}
