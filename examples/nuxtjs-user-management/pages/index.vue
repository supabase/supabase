<template>
  <div
    style="
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    "
  >
    <div class="flex" style="gap: 30">
      <div class="flex column w-half">
        <h3>Account</h3>
        <div v-if="!state.session">
          <Auth />
        </div>
        <div v-else>
          <Account :session="state.session" />
        </div>
      </div>
      <div class="flex column w-half" style="gap: 20">
        <h3>Public Profiles</h3>
        <div v-if="state.profiles.length > 0">
          <ProfileList :profiles="state.profiles" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from "../lib/supabaseClient";
export default {
  data() {
    return {
      state: {
        session: null,
        profiles: [],
      },
    };
  },
  mounted() {
    this.state.session = supabase.auth.session();

    supabase.auth.onAuthStateChange((_event, session) => {
      this.state.session = session;
    });

    this.getPublicProfiles();
  },
  methods: {
    async getPublicProfiles() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, website, updated_at")
          .order("updated_at", { ascending: false });

        if (error || !data) {
          throw error || new Error("No data");
        }
        console.log("data", data);
        this.state.profiles = data;
      } catch (error) {
        console.log("error", error.message);
      }
    },
  },
};
</script>

<style>
.container {
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}
</style>
