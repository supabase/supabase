<script>
  import TailwindStyles from './TailwindStyles.svelte'
  import Lists from './Lists.svelte'
  import { items } from './items'
  export let user // = localStorage.getItem("user")
  let lists
  // let todos
  let list_id
  $: lists = items()
  list_id = lists && lists.length > 0 ? lists[0].id : 2

  // $: todos = lists && lists.length > 0 ? lists[0].tasks : []

  </script>
  <Lists user_id={user.id} lists={lists} list_id={list_id} />
