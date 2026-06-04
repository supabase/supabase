const { defineConfig } = require('eslint/config')
const supabaseConfig = require('eslint-config-supabase/next')

module.exports = defineConfig([supabaseConfig])
