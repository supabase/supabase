import { useParams } from 'common'
import uuidv4 from 'lib/uuid'
import { Upload } from 'lucide-react'
import { ChangeEvent, useRef } from 'react'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconEdit,
} from 'ui'
import { uploadFileToSupabaseComProject } from './upload'

export const LogoFileInput = ({
  logoUrl,
  onChange,
}: {
  logoUrl: string | null
  onChange: (s: string | null) => void
}) => {
  const { slug } = useParams()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    event.persist()
    const [file] = event.target.files || (event as any).dataTransfer.items

    if (!file) return

    const generatedId = uuidv4()
    uploadFileToSupabaseComProject(
      'temp-for-testing-integrations',
      `${slug}/logo/${generatedId}`,
      file,
      true
    ).then((url) => {
      onChange(url!)
    })
  }

  return (
    <>
      {logoUrl ? (
        <div
          className={cn(
            'shadow transition group relative',
            'bg-center bg-cover bg-no-repeat',
            'mt-4 mr-4 space-y-2 rounded-full h-[120px] w-[120px] flex flex-col items-center justify-center'
          )}
          style={{
            backgroundImage: `url("${logoUrl}")`,
          }}
        >
          <div className="absolute bottom-1 right-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="default" className="px-1">
                  <IconEdit />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom">
                <DropdownMenuItem
                  key="upload"
                  onClick={() => {
                    fileInputRef.current?.click()
                  }}
                >
                  <p>Upload image</p>
                </DropdownMenuItem>
                <DropdownMenuItem key="remove" onClick={() => onChange(null)}>
                  <p>Remove image</p>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'border border-strong transition opacity-75 hover:opacity-100',
            'mt-4 mr-4 space-y-2 rounded-full h-[120px] w-[120px] flex flex-col items-center justify-center cursor-pointer'
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={18} strokeWidth={1.5} className="text-foreground" />
          <p className="text-xs text-foreground-light">Upload logo</p>
        </div>
      )}
      <input
        multiple
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/png, image/jpeg"
        onChange={onFileUpload}
      />
    </>
  )
}
