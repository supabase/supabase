<script lang="js">
  import Lists from './Lists.svelte'
  export let lists
  export let user_id
</script>
<style>
</style>

<Lists bind:user_id bind:lists />