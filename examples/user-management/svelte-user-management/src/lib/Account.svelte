<script lang="ts">
  import { onMount } from "svelte";
  import type { AuthSession } from "@supabase/supabase-js";
  import { supabase } from "../supabaseClient";
  import Avatar from "./Avatar.svelte";

  interface Props {
    session: AuthSession;
  }

  let { session }: Props = $props();

  let loading = $state(false);
  let username = $state<string | null>(null);
  let website = $state<string | null>(null);
  let avatarUrl = $state<string | null>(null);

  onMount(() => {
    getProfile();
  });

  const getProfile = async () => {
    try {
      loading = true;
      const { user } = session;

      const { data, error, status } = await supabase
        .from("profiles")
        .select("username, website, avatar_url")
        .eq("id", user.id)
        .single();

      if (error && status !== 406) throw error;

      if (data) {
        username = data.username;
        website = data.website;
        avatarUrl = data.avatar_url;
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      loading = false;
    }
  };

  const updateProfile = async () => {
    try {
      loading = true;
      const { user } = session;

      const updates = {
        id: user.id,
        username,
        website,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) {
        throw error;
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      loading = false;
    }
  };
</script>

<form onsubmit={(e) => { e.preventDefault(); updateProfile(); }} class="form-widget">
  <div>Email: {session.user.email}</div>
  <div>
    <Avatar bind:url={avatarUrl} size={150} onupload={updateProfile} />
    <label for="username">Name</label>
    <input id="username" type="text" bind:value={username} />
  </div>
  <div>
    <label for="website">Website</label>
    <input id="website" type="text" bind:value={website} />
  </div>
  <div>
    <button type="submit" class="button primary block" disabled={loading}>
      {loading ? "Saving ..." : "Update profile"}
    </button>
  </div>
  <button
    type="button"
    class="button block"
    onclick={() => supabase.auth.signOut()}
  >
    Sign Out
  </button>
</form>
