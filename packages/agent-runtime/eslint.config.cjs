const { defineConfig } = require('eslint/config')
const supabaseConfig = require('eslint-config-supabase/node')

module.exports = defineConfig([...supabaseConfig])
