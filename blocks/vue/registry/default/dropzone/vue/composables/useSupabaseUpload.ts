import { ref, computed, watch } from 'vue'
import { useDropZone } from '@vueuse/core'
import { createClient } from "@/lib/supabase/client"

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
    return (
      !errors.value.length &&
      successes.value.length === files.value.length
    )
  })

  const dropZoneRef = ref<HTMLElement | null>(null)

  const { isOverDropZone } = useDropZone(dropZoneRef, {
    onDrop(droppedFiles: FileWithPreview[]) {
      if (!droppedFiles) return

      const newFiles: FileWithPreview[] = []

      for (const file of droppedFiles) {
        const fileErrors: FileWithPreview['errors'] = []

        if (
          allowedMimeTypes.length &&
          !allowedMimeTypes.some((t) =>
            t.endsWith('/*')
              ? file.type.startsWith(t.replace('/*', ''))
              : file.type === t
          )
        ) {
          fileErrors.push({
            code: 'invalid-type',
            message: `Invalid file type`,
          })
        }

        if (file.size > maxFileSize) {
          fileErrors.push({
            code: 'file-too-large',
            message: `File is larger than allowed size`,
          })
        }

        newFiles.push({
          ...(file as FileWithPreview),
          preview: URL.createObjectURL(file),
          errors: fileErrors,
        })
      }

      files.value = [...files.value, ...newFiles]
    },
  })

  const onUpload = async () => {
    loading.value = true

    const filesWithErrors = errors.value.map((e) => e.name)

    const filesToUpload =
      filesWithErrors.length > 0
        ? files.value.filter(
            (f) =>
              filesWithErrors.includes(f.name) ||
              !successes.value.includes(f.name)
          )
        : files.value

    const responses = await Promise.all(
      filesToUpload.map(async (file) => {
        const { error } = await supabase.storage
          .from(bucketName)
          .upload(
            path ? `${path}/${file.name}` : file.name,
            file,
            {
              cacheControl: cacheControl.toString(),
              upsert,
            }
          )

        return error
          ? { name: file.name, message: error.message }
          : { name: file.name, message: undefined }
      })
    )

    errors.value = responses.filter(
      (r) => r.message
    ) as { name: string; message: string }[]

    const successful = responses
      .filter((r) => !r.message)
      .map((r) => r.name)

    successes.value = Array.from(
      new Set([...successes.value, ...successful])
    )

    loading.value = false
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

  return {
    dropZoneRef,
    isOverDropZone,

    files,
    setFiles: (v: FileWithPreview[]) => (files.value = v),

    errors,
    setErrors: (v: { name: string; message: string }[]) =>
      (errors.value = v),

    successes,
    isSuccess,
    loading,
    onUpload,

    maxFileSize,
    maxFiles,
    allowedMimeTypes,
  }
}
