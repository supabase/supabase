<script setup lang="ts">
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { CheckCircle, File, Loader2, X } from 'lucide-vue-next'
import { formatBytes, useDropzoneContext } from './dropzone.vue'
import { computed } from 'vue';

const props = defineProps<{ className?: string }>()

const {
  files,
  setFiles,
  onUpload,
  loading,
  successes,
  errors,
  maxFileSize,
  maxFiles,
  isSuccess,
} = useDropzoneContext()

const exceedMaxFiles = computed(() => files.length > maxFiles)

const fileErrorMessages = computed(() => new Map(errors.map(e => [e.name, e.message])))

function formatFileErrors(file: typeof files[number]) {
  if (!file.errors || file.errors.length === 0) return ''
  return file.errors
    .map(e =>
      e.message.startsWith('File is larger than')
        ? `File is larger than ${formatBytes(maxFileSize)} (Size: ${formatBytes(file.size)})`
        : e.message
    )
    .join(', ')
}

function handleRemoveFile(filename: string) {
  setFiles(files.filter(f => f.name !== filename))
}
</script>

<template>
  <div :class="cn('flex flex-col', props.className)">
    <!-- Success State -->
    <div v-if="isSuccess" class="flex flex-row items-center gap-x-2 justify-center" role="status" aria-live="polite">
      <CheckCircle size="16" class="text-primary" aria-hidden="true"/>
      <p class="text-primary text-sm">
        Successfully uploaded {{ files.length }} file{{ files.length > 1 ? 's' : '' }}
      </p>
    </div>

    <!-- File list -->
    <template v-else>
      <div
        v-for="(file, idx) in files"
        :key="file?.name + '-' + file?.lastModified + '-' + file?.size || file?.name + '-' + idx"
        class="flex items-center gap-x-4 border-b py-2 first:mt-4 last:mb-4"
      >
        <div v-if="file.type.startsWith('image/')"
             class="h-10 w-10 rounded border overflow-hidden shrink-0 bg-muted flex items-center justify-center">
          <img :src="file.preview" :alt="file.name" class="object-cover" />
        </div>

        <div v-else class="h-10 w-10 rounded border bg-muted flex items-center justify-center">
          <File size="18" aria-hidden="true" />
        </div>

        <div class="shrink grow flex flex-col items-start truncate">
          <p class="text-sm truncate max-w-full" :title="file.name">
            {{ file.name }}
          </p>

          <!-- ARIA live region for status messages -->
          <div aria-live="polite" aria-atomic="true">
            <!-- Errors -->
            <p v-if="file.errors.length > 0" class="text-xs text-destructive">
              {{ formatFileErrors(file) }}
            </p>

            <!-- Uploading -->
            <p v-else-if="loading" class="text-xs text-muted-foreground">Uploading file...</p>

            <!-- Failed -->
            <p v-else-if="fileErrorMessages.has(file.name)" class="text-xs text-destructive">
              Failed to upload: {{ fileErrorMessages.get(file.name) }}
            </p>

            <!-- Success -->
            <p v-else-if="successes.includes(file.name)" class="text-xs text-primary">
              Successfully uploaded file
            </p>

            <!-- Normal -->
            <p v-else class="text-xs text-muted-foreground">
              {{ formatBytes(file.size) }}
            </p>
          </div>
        </div>

        <Button
          v-if="!loading && !successes.includes(file.name)"
          aria-label="Remove file Button"
          size="icon"
          variant="link"
          class="shrink-0 text-muted-foreground hover:text-foreground"
          @click="handleRemoveFile(file.name)"
        >
          <X />
        </Button>
      </div>

      <!-- Too many files -->
      <p v-if="exceedMaxFiles" class="text-sm text-left mt-2 text-destructive">
        You may upload only up to {{ maxFiles }} files, please remove
        {{ files.length - maxFiles }} file(s).
      </p>

      <!-- Upload button -->
      <div v-if="files.length > 0 && !exceedMaxFiles" class="mt-2">
        <Button
          variant="outline"
          :disabled="files.some(f => f.errors.length) || loading"
          @click="onUpload"
        >
          <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          <template v-if="loading">Uploading...</template>
          <template v-else>Upload files</template>
        </Button>
      </div>
    </template>
  </div>
</template>
