<script setup>
import { useSupabase } from '~/composables/useSupabase'

const supabase = useSupabase()
const { data: posts } = await supabase.from('posts').select('*')
</script>

<template>
  <div>
    <h1>Supabase + Nuxt SSR Example</h1>
    <ul>
      <li v-for="post in posts" :key="post.id">{{ post.title }}</li>
    </ul>
  </div>
</template>
