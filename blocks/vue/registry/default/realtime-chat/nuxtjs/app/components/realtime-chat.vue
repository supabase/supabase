<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Send } from 'lucide-vue-next'

import ChatMessageItem from './chat-message-item.vue'
import { useChatScroll } from '../composables/useChatScroll'
import {
  useRealtimeChat,
  type ChatMessage,
} from '../composables/useRealtimeChat'
  // @ts-ignore
import Button from '@/components/ui/Button.vue'
  // @ts-ignore
import Input from '@/components/ui/Input.vue'

interface RealtimeChatProps {
  roomName: string
  username: string
  onMessage?: (messages: ChatMessage[]) => void
  messages?: ChatMessage[]
}

const props = defineProps<RealtimeChatProps>()

const initialMessages = computed(() => props.messages ?? [])

const { containerRef, scrollToBottom } = useChatScroll()

const { messages: realtimeMessages, sendMessage, isConnected } =
  useRealtimeChat({
    roomName: props.roomName,
    username: props.username,
  })

const newMessage = ref('')

/**
 * Merge + dedupe + sort
 */
const allMessages = computed<ChatMessage[]>(() => {
  const merged = [...initialMessages.value, ...realtimeMessages.value]

  const unique = merged.filter(
    (message, index, self) =>
      index === self.findIndex((m) => m.id === message.id)
  )

  return unique.sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  )
})

/**
 * Emit messages to parent if callback provided
 */
watch(allMessages, (messages) => {
  if (props.onMessage) {
    props.onMessage(messages)
  }

  scrollToBottom()
}, { flush: 'post' })

function handleSendMessage() {
  if (!newMessage.value.trim() || !isConnected.value) return

  sendMessage(newMessage.value)
  newMessage.value = ''
}
</script>

<template>
  <div class="flex flex-col h-full w-full bg-background text-foreground antialiased">
    <!-- Messages -->
    <div
      ref="containerRef"
      class="flex-1 overflow-y-auto p-4 space-y-4"
    >
      <div
        v-if="allMessages.length === 0"
        class="text-center text-sm text-muted-foreground"
      >
        No messages yet. Start the conversation!
      </div>

      <div class="space-y-1">
        <div
          v-for="(message, index) in allMessages"
          :key="message.id"
          class="animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <ChatMessageItem
            :message="message"
            :isOwnMessage="message.user.name === props.username"
            :showHeader="
              !allMessages[index - 1] ||
              allMessages[index - 1].user.name !== message.user.name
            "
          />
        </div>
      </div>
    </div>

    <!-- Input -->
    <form
      @submit.prevent="handleSendMessage"
      class="flex w-full gap-2 border-t border-border p-4"
    >
      <Input
        v-model="newMessage"
        :disabled="!isConnected"
        type="text"
        placeholder="Type a message..."
        :class="[
          'rounded-full bg-background text-sm transition-all duration-300',
          isConnected && newMessage.trim()
            ? 'w-[calc(100%-36px)]'
            : 'w-full',
        ]"
      />

      <Button
        v-if="isConnected && newMessage.trim()"
        type="submit"
        :disabled="!isConnected"
        class="aspect-square rounded-full animate-in fade-in slide-in-from-right-4 duration-300"
      >
        <Send class="size-4" />
      </Button>
    </form>
  </div>
</template>
