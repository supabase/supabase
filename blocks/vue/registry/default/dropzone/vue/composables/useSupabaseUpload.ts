import { useDropZone } from '@vueuse/core'
import { computed, onUnmounted, ref, watch } from 'vue'

// @ts-ignore
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface FileWithPreview extends File {
  preview?: string
  errors: { code: string; message: string }[]
}

export type UseSupabaseUploadOptions = {
  bucketName: string
  path?: string
  allowedMimeTypes?: string[]
  maxFileSize?: number
  maxFiles?: number
  cacheControl?: number
  upsert?: boolean
}

function validateFileType(file: File, allowedTypes: string[]) {
  if (!allowedTypes.length) return []
  const isValid = allowedTypes.some((t) =>
    t.endsWith('/*') ? file.type.startsWith(t.replace('/*', '')) : file.type === t
  )
  return isValid ? [] : [{ code: 'invalid-type', message: 'Invalid file type' }]
}

function validateFileSize(file: File, maxSize: number) {
  return file.size > maxSize
    ? [{ code: 'file-too-large', message: `File is larger than allowed size` }]
    : []
}

export function useSupabaseUpload(options: UseSupabaseUploadOptions) {
  const {
    bucketName,
    path,
    allowedMimeTypes = [],
    maxFileSize = Number.POSITIVE_INFINITY,
    maxFiles = 1,
    cacheControl = 3600,
    upsert = false,
  } = options

  const files = ref<FileWithPreview[]>([])
  const loading = ref(false)
  const errors = ref<{ name: string; message: string }[]>([])
  const successes = ref<string[]>([])

  const isSuccess = computed(() => {
    if (!errors.value.length && !successes.value.length) return false
    return !errors.value.length && successes.value.length === files.value.length
  })

  const dropZoneRef = ref<HTMLElement | null>(null)

  const { isOverDropZone } = useDropZone(dropZoneRef, {
    onDrop(droppedFiles: File[] | null) {
      if (!droppedFiles) return

      const newFiles: FileWithPreview[] = droppedFiles.map((file) => ({
        ...(file as FileWithPreview),
        preview: URL.createObjectURL(file),
        errors: [
          ...validateFileType(file, allowedMimeTypes),
          ...validateFileSize(file, maxFileSize),
        ],
      }))

      files.value = [...files.value, ...newFiles]
    },
  })

  const onUpload = async () => {
    loading.value = true

    try {
      const filesWithErrors = errors.value.map((e) => e.name)

      const filesToUpload =
        filesWithErrors.length > 0
          ? files.value.filter(
              (f) => filesWithErrors.includes(f.name) || !successes.value.includes(f.name)
            )
          : files.value

      const responses = await Promise.all(
        filesToUpload.map(async (file) => {
          const { error } = await supabase.storage
            .from(bucketName)
            .upload(path ? `${path}/${file.name}` : file.name, file, {
              cacheControl: cacheControl.toString(),
              upsert,
            })

          return error
            ? { name: file.name, message: error.message }
            : { name: file.name, message: undefined }
        })
      )

      errors.value = responses.filter(
        (r): r is { name: string; message: string } => r.message !== undefined
      )

      const successful = responses.filter((r) => !r.message).map((r) => r.name)

      successes.value = Array.from(new Set([...successes.value, ...successful]))
    } catch (err) {
      console.error('Upload failed unexpectedly:', err)

      errors.value.push({
        name: 'upload',
        message: 'An unexpected error occurred during upload.',
      })
    } finally {
      loading.value = false
    }
  }

  watch(
    () => files.value.length,
    () => {
      if (!files.value.length) {
        errors.value = []
        successes.value = []
      }

      if (files.value.length > maxFiles) {
        errors.value.push({
          name: 'files',
          message: `You may upload up to ${maxFiles} files`,
        })
      }
    }
  )

  watch(
    files,
    (newFiles, oldFiles) => {
      const newPreviews = new Set(newFiles.map((f) => f.preview))
      oldFiles.forEach((file) => {
        if (file.preview && !newPreviews.has(file.preview)) {
          URL.revokeObjectURL(file.preview)
        }
      })
    },
    { deep: true }
  )

  onUnmounted(() => {
    files.value.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
    })
  })

  return {
    dropZoneRef,
    isOverDropZone,

    files,
    setFiles: (v: FileWithPreview[]) => (files.value = v),

    errors,
    setErrors: (v: { name: string; message: string }[]) => (errors.value = v),

    successes,
    isSuccess,
    loading,
    onUpload,

    maxFileSize,
    maxFiles,
    allowedMimeTypes,
  }
}
