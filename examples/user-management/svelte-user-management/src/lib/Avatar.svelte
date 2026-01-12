<script lang="ts">
  import { supabase } from "../supabaseClient";

  interface Props {
    size: number;
    url?: string | null;
    onupload?: () => void;
  }

  let { size, url = $bindable(null), onupload }: Props = $props();

  let avatarUrl = $state<string | null>(null);
  let uploading = $state(false);
  let files = $state<FileList>();

  const downloadImage = async (path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("avatars")
        .download(path);

      if (error) {
        throw error;
      }

      const url = URL.createObjectURL(data);
      avatarUrl = url;
    } catch (error) {
      if (error instanceof Error) {
        console.log("Error downloading image: ", error.message);
      }
    }
  };

  const uploadAvatar = async () => {
    try {
      uploading = true;

      if (!files || files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${Math.random()}.${fileExt}`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      url = filePath;
      onupload?.();
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    } finally {
      uploading = false;
    }
  };

  $effect(() => {
    if (url) downloadImage(url);
  });
</script>

<div style="width: {size}px" aria-live="polite">
  {#if avatarUrl}
    <img
      src={avatarUrl}
      alt={avatarUrl ? "Avatar" : "No image"}
      class="avatar image"
      style="height: {size}px, width: {size}px"
    />
  {:else}
    <div class="avatar no-image" style="height: {size}px, width: {size}px"></div>
  {/if}
  <div style="width: {size}px">
    <label class="button primary block" for="single">
      {uploading ? "Uploading ..." : "Upload avatar"}
    </label>
    <span style="display:none">
      <input
        type="file"
        id="single"
        accept="image/*"
        bind:files
        onchange={uploadAvatar}
        disabled={uploading}
      />
    </span>
  </div>
</div>
