# Vue 3 Supabase.js

:hamburger: Simple [Vue 3](https://github.com/vuejs/docs-next) wrap for [Supabase.js Client](https://supabase.io/docs/reference/javascript/supabase-client) build with [Vitejs](https://github.com/vitejs/vite)

### Table of content:
- [Install](#install-plugin)
- [Usages](#usages)
- [Methods](#methods)

Install the package via npm:

``` bash
npm i vue-3-supabase
```

# Install

It's Simple! In your `main.js` add the following:

``` javascript
import { createApp } from 'vue'
import App from './App.vue'

// Import supabase
import supabase from 'vue-3-supabase'

const app = createApp(App)

// Use supabase
app.use(supabase, {
  supabaseUrl: 'https://xxxxxxxxxxxxxxxxx.supabase.co', // actually you can use something like import.meta.env.VITE_SUPABASE_URL
  supabaseKey: 'xxxxx__xxxxx___xxxxx___xxxxx', // actually you can use something like import.meta.env.VITE_SUPABASE_KEY,
  options: {}
})

app.mount('#app')
```

It takes three params as argument :

`supabaseUrl`: the unique **required** Supabase URL which is supplied when you create a new project in your project dashboard.

`supabaseKey`: the unique **required** Supabase Key which is supplied when you create a new project in your project dashboard.

`options`: additional parameters **not required**

More references [here](https://supabase.io/docs/reference/javascript/initializing)

# Usages

### Options API

In the **Option API** you can use `this.$supabase` to access the Supabase.js Client:

``` vue
<template>
  // Your HTML Stuff
</template>

<script>
export default {
  async mounted () {
    const { user, session, error } = await this.$supabase.auth.signUp({
      email: 'user@provider.com',
      password: 'myawesomepassword',
    })
    console.log(user, session, error)
  }
}
</script>
```

### Composition API

In the **Composition API** you can use `inject('supabase')` to access the Supabase.js Client:

``` vue
<template>
  // Your HTML Stuff
</template>

<script setup>
import { inject, onMounted } from 'vue'

const supabase = inject('supabase')

onMounted(async () => {
  const { user, session, error } = await supabase.auth.signUp({
    email: 'user@provider.com',
    password: 'myawesomepassword',
  })
  console.log(user, session, error)
})
</script>
```

# Methods

Here the methods references from official doc:

- [Auth](https://supabase.io/docs/reference/javascript/auth-signup)
- [Data](https://supabase.io/docs/reference/javascript/select)
- [Realtime](https://supabase.io/docs/reference/javascript/subscribe)
- [Storage](https://supabase.io/docs/reference/javascript/storage-createbucket)
- [Modifiers](https://supabase.io/docs/reference/javascript/using-modifiers)
- [Filters](https://supabase.io/docs/reference/javascript/using-filters)

Enjoy :punch: