<template>
    <form class="form-widget" @submit.prevent="updateProfile">
        <Avatar v-model:path="avatar_path" @upload="updateProfile" :size="10" />
        <div>
            <label for="email">Email</label>
            <input id="email" type="text" :value="user.email" disabled />
        </div>
        <div>
            <label for="username">Name</label>
            <input id="username" type="text" v-model="username" />
        </div>
        <div>
            <label for="website">Website</label>
            <input id="website" type="url" v-model="website" />
        </div>

        <div>
            <input type="submit" class="button block primary" :value="loading ? 'Loading ...' : 'Update'"
                :disabled="loading" />
        </div>

        <div>
            <button type="button" class="button block" @click="signOut">
                Sign Out
            </button>
        </div>
    </form>
</template>

<script setup>
const supabase = useSupabaseClient()

const loading = ref(false)
const username = ref('')
const website = ref('')
const avatar_path = ref('')

const user = useSupabaseUser();
const { data: profile } = await useAsyncData('profile', async () => {
    loading.value = true
    const { data } = await supabase
        .from('profiles')
        .select(`username, website, avatar_url`)
        .eq('id', user.value.id)
        .single()

    loading.value = false
    return data
})

if (profile.value.username) {
    username.value = profile.value.username
    website.value = profile.value.website
    avatar_path.value = profile.value.avatar_url
}

async function updateProfile() {
    try {
        loading.value = true
        const user = useSupabaseUser();
        const updates = {
            id: user.value.id,
            username: username.value,
            website: website.value,
            avatar_url: avatar_path.value,
            updated_at: new Date(),
        }
        let { error } = await supabase.from('profiles').upsert(updates)
        if (error) throw error
    } catch (error) {
        alert(error.message)
    } finally {
        loading.value = false
    }
}

const supabaseAuth = useSupabaseAuthClient()
async function signOut() {
    try {
        loading.value = true
        let { error } = await supabaseAuth.auth.signOut()
        if (error) throw error
    } catch (error) {
        alert(error.message)
    } finally {
        loading.value = false
    }
}
</script>
