import { createSupportStorageClient } from 'components/interfaces/Support/support-storage-client'
import { generateAttachmentURLs } from 'data/support/generate-attachment-urls-mutation'
import { uuidv4 } from 'lib/helpers'

export const convertB64toBlob = (image: string) => {
  const contentType = 'image/png'
  const byteCharacters = atob(image.substr(`data:${contentType};base64,`.length))
  const byteArrays = []

  for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
    const slice = byteCharacters.slice(offset, offset + 1024)

    const byteNumbers = new Array(slice.length)
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)

    byteArrays.push(byteArray)
  }
  const blob = new Blob(byteArrays, { type: contentType })
  return blob
}

type UploadAttachmentArgs = {
  image: string
  userId?: string
}

export const uploadAttachment = async ({ image, userId }: UploadAttachmentArgs) => {
  if (!userId) {
    console.error(
      '[FeedbackWidget > uploadAttachment] Unable to upload screenshot, missing user ID'
    )
    return undefined
  }

  const supabaseClient = createSupportStorageClient()

  const blob = convertB64toBlob(image)
  const filename = `${userId}/${uuidv4()}.png`
  const options = { cacheControl: '3600' }

  const { data: file, error: uploadError } = await supabaseClient.storage
    .from('feedback-attachments')
    .upload(filename, blob, options)

  if (uploadError || !file) {
    console.error('Failed to upload screenshot attachment:', uploadError)
    return undefined
  }

  const signedUrls = await generateAttachmentURLs({
    bucket: 'feedback-attachments',
    filenames: [file.path],
  })
  return signedUrls[0]
}
