import { FEEDBACK_IMAGE_EXTENSIONS, FEEDBACK_LIMITS } from './feedback-schema'

type FeedbackImageType = keyof typeof FEEDBACK_IMAGE_EXTENSIONS

export interface FeedbackImage {
  path: string
  file: File
}

export const FEEDBACK_IMAGE_ACCEPT = Object.keys(FEEDBACK_IMAGE_EXTENSIONS).join(',')

export const createFeedbackImages = (
  files: File[]
): { images: FeedbackImage[]; rejectedCount: number } =>
  files.reduce<{ images: FeedbackImage[]; rejectedCount: number }>(
    (result, file) => {
      if (!isFeedbackImageType(file.type) || file.size > FEEDBACK_LIMITS.imageBytes) {
        return { ...result, rejectedCount: result.rejectedCount + 1 }
      }
      const path = `${crypto.randomUUID()}.${FEEDBACK_IMAGE_EXTENSIONS[file.type]}`
      return { ...result, images: [...result.images, { path, file }] }
    },
    { images: [], rejectedCount: 0 }
  )

const isFeedbackImageType = (type: string): type is FeedbackImageType =>
  Object.hasOwn(FEEDBACK_IMAGE_EXTENSIONS, type)
