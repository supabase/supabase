<script setup lang="ts">
import { provide, inject } from 'vue'
import { cn } from "@/lib/utils"

export const formatBytes = (
  bytes: number,
  decimals = 2,
  size?: 'bytes' | 'KB' | 'MB' | 'GB' | 'TB' | 'PB' | 'EB' | 'ZB' | 'YB'
) => {
  const k = 1000
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  if (bytes === 0 || bytes === undefined)
    return size ? `0 ${size}` : '0 bytes'

  const i = size ? sizes.indexOf(size) : Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

const DropzoneContext = Symbol('DropzoneContext')

export function useDropzoneContext() {
  const ctx = inject<any>(DropzoneContext)
  if (!ctx) throw new Error('useDropzoneContext must be used within <Dropzone>')
  return ctx
}

const props = defineProps<any>()

provide(DropzoneContext, props)
</script>

<template>
  <div
    v-bind="props.getRootProps({
      class: cn(
        'border-2 border-gray-300 rounded-lg p-6 text-center bg-card transition-colors duration-300 text-foreground',
        props.className,
        props.isSuccess ? 'border-solid' : 'border-dashed',
        props.isDragActive && 'border-primary bg-primary/10',
        ((props.isDragActive && props.isDragReject) ||
          (props.errors.length > 0 && !props.isSuccess) ||
          props.files.some(f => f.errors.length !== 0))
          && 'border-destructive bg-destructive/10'
      )
    })"
  >
    <input v-bind="props.getInputProps()" />
    <slot />
  </div>
</template>
