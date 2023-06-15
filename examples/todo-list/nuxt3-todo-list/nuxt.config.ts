// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxthq/ui',
    '@nuxtjs/supabase'
  ],
  devtools: { enabled: true },
  css: [
    '@/assets/css/main.scss',
  ],
})
