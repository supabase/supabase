<script setup lang="ts">
import { computed } from 'vue'
import type { ChatMessage } from '../composables/useRealtimeChat'

const props = defineProps<{
  message: ChatMessage
  isOwnMessage: boolean
  showHeader: boolean
}>()

const containerClasses = computed(() => [
  'flex mt-2',
  props.isOwnMessage ? 'justify-end' : 'justify-start',
])

const wrapperClasses = computed(() => [
  'max-w-[75%] w-fit flex flex-col gap-1',
  props.isOwnMessage ? 'items-end' : '',
])

const headerClasses = computed(() => [
  'flex items-center gap-2 text-xs px-3',
  props.isOwnMessage ? 'justify-end flex-row-reverse' : '',
])

const bubbleClasses = computed(() => [
  'py-2 px-3 rounded-xl text-sm w-fit',
  props.isOwnMessage
    ? 'bg-primary text-primary-foreground'
    : 'bg-muted text-foreground',
])

const formattedTime = computed(() =>
  new Date(props.message.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
)
</script>

<template>
  <div :class="containerClasses">
    <div :class="wrapperClasses">
      <!-- Header -->
      <div v-if="showHeader" :class="headerClasses">
        <span class="font-medium">
          {{ message.user.name }}
        </span>

        <span class="text-foreground/50 text-xs">
          {{ formattedTime }}
        </span>
      </div>

      <!-- Message Bubble -->
      <div :class="bubbleClasses">
        {{ message.content }}
      </div>
    </div>
  </div>
</template>
