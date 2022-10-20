<template>
  <div class="account">
    <div>
      <label for="email">Email</label>
      <input id="email" type="text" v-model="state.propSession.user.email" disabled />
    </div>
    <div>
      <label for="username">Username</label>
      <input id="username" type="text" v-model="state.username" />
    </div>
    <div>
      <label for="website">Website</label>
      <input id="website" type="website" v-model="state.website" />
    </div>

    <div>
      <button class="button block primary" @click="updateProfile" :disabled="state.loading">
        {{ state.loading ? 'Loading ...' : 'Update' }}
      </button>
    </div>

    <div>
      <button @click="signOut" class="button block">Sign Out</button>
    </div>
  </div>
</template>

<script>
import { supabase } from '../lib/supabaseClient'
export default {
  props: ['session'],
  data() {
    return {
      state: {
        loading: true,
        username: '',
        website: '',
        propSession: this.session,
      },
    }
  },
  mounted() {
    this.getProfile()
  },
  methods: {
    async signOut() {
      const { error } = await supabase.auth.signOut()
      if (error) console.log('Error logging out:', error.message)
    },

    setProfile(profile) {
      this.state.username = profile.username
      this.state.website = profile.website
    },

    async getProfile() {
      try {
        this.state.loading = true

        const { data, error } = await supabase
          .from('profiles')
          .select(`username, website, avatar_url`)
          .eq('id', this.state.propSession.user.id)
          .single()

        if (error || !data) {
          throw error || new Error('Profile not found')
        }

        this.setProfile(data)
      } catch (error) {
        console.log('error', error.message)
      } finally {
        this.state.loading = false
      }
    },

    async updateProfile() {
      try {
        this.state.loading = true

        const updates = {
          id: this.state.propSession.user.id,
          username: this.state.username,
          website: this.state.website,
          updated_at: new Date(),
        }

        const { error } = await supabase.from('profiles').upsert(updates)

        if (error) {
          throw error
        }
      } catch (error) {
        alert(error.message)
      } finally {
        this.state.loading = false
      }
    },
  },
}
</script>
