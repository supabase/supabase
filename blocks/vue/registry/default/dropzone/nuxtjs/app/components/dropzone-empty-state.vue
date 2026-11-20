<script setup lang="ts">
import { Upload } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { useDropzoneContext, formatBytes } from './dropzone.vue'

const props = defineProps<{ className?: string }>()

const { maxFiles, maxFileSize, inputRef, isSuccess } = useDropzoneContext()
</script>

<template>
  <div v-if="!isSuccess" :class="cn('flex flex-col items-center gap-y-2', props.className)">
    <Upload size="20" class="text-muted-foreground" aria-hidden="true" />

    <p class="text-sm">
      Upload{{ maxFiles > 1 ? ` ${maxFiles}` : '' }} file{{ maxFiles !== 1 ? 's' : '' }}
    </p>

    <div class="flex flex-col items-center gap-y-1">
      <p class="text-xs text-muted-foreground">
        Drag and drop or
        <button
          type="button"
          class="underline cursor-pointer hover:text-foreground"
          @click="inputRef?.click()"
        >
          select file{{ maxFiles !== 1 ? 's' : '' }}
        </button>
        to upload
      </p>

      <p v-if="maxFileSize !== Infinity" class="text-xs text-muted-foreground">
        Maximum file size: {{ formatBytes(maxFileSize) }}
      </p>
    </div>
  </div>
</template>
