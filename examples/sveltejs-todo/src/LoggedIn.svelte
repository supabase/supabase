<script>
  import TailwindStyles from './TailwindStyles.svelte'
  import Lists from './Lists.svelte'
  import { items, subscription } from './items'
  export let user
  $: lists = items()
  // $: lists2 = subscription()
</script>

<Lists user_id={user.id} {lists} />
