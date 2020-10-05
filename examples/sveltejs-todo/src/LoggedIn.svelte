<script>
  import TailwindStyles from './TailwindStyles.svelte'
  import Lists from './Lists.svelte'
  import { items } from './items'
  export let user // = localStorage.getItem("user")
  // let lists
  // let todos

  $: lists = items()


  // $: todos = lists && lists.length > 0 ? lists[0].tasks : []

  </script>
  <Lists user_id={user.id} lists={lists}  />
