<template>
  <div class="container" style="padding: 50px 0 100px">
    <Auth  v-if="!state.session" />
    <div class="row" v-else>
      <div class="col-6">
        <h3>Account</h3>
        <Account :session="state.session" />
      </div>
      <div class="col-6">
        <h3>Public Profiles</h3>
        <template v-if="state.profiles.length > 0">
          <ProfileList :profiles="state.profiles" />
        </template>
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      this.state.session = session;
    });

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
