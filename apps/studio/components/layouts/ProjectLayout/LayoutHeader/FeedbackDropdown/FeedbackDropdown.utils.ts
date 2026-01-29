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

/**
 * Client-side heuristic to quickly detect obvious support requests
 * This provides immediate feedback before the AI classification completes
 */
export function isLikelySupportRequest(text: string): boolean {
  if (!text || text.trim().length === 0) return false

  const lowerText = text.toLowerCase()

  // Common support request patterns
  const supportPatterns = [
    // Help requests
    /need help/i,
    /having trouble/i,
    /having issues/i,
    /having problems/i,
    /can you help/i,
    /could you help/i,
    /please help/i,
    /need help/i,
    /how do/i,
    /how can/i,
    /how to/i,
    /why isn't/i,
    /why doesn't/i,
    /why won't/i,
    /why can't/i,

    // Problem indicators
    /it's not working/i,
    /it doesn't work/i,
    /it won't work/i,
    /it can't work/i,
    /isn't working/i,
    /doesn't work/i,
    /won't work/i,
    /can't work/i,
    /not work/i,
    /i can't/i,
    /i cannot/i,
    /unable to/i,
    /wrong/i,
    /bad/i,

    // Bug/error indicators
    /\bbug\b/i,
    /\bbroken\b/i,
    /\berror\b/i,
    /\berrors\b/i,
    /\bfailed\b/i,
    /\bfailure\b/i,
    /\bfailing\b/i,
    /\bcrash\b/i,
    /\bcrashed\b/i,
    /\bcrashing\b/i,

    // Issue/problem keywords
    /\bissue\b/i,
    /\bissues\b/i,
    /\bproblem\b/i,
    /\bproblems\b/i,
    /\btrouble\b/i,
    /\bdifficulty\b/i,
    /\bdifficulties\b/i,

    // Support-specific phrases
    /support ticket/i,
    /contact support/i,
    /get help/i,
    /need assistance/i,
    /require assistance/i,
    /technical support/i,
  ]

  return supportPatterns.some((pattern) => pattern.test(lowerText))
}
