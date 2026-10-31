<script setup lang="ts">
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

type LabelVariants = VariantProps<typeof labelVariants>

defineProps<{
  as?: string
  class?: string
}>()

const props = defineProps({
  as: { type: String, default: "label" },
  class: { type: String, default: "" },
})

const labelClass = cn(labelVariants(), props.class)
</script>

<template>
  <component :is="as" :class="labelClass">
    <slot />
  </component>
</template>
