<script>
	import TailwindStyles from './TailwindStyles.svelte';
	

	const ENTER_KEY = 13;
	const ESCAPE_KEY = 27;
	let currentFilter = 'all';
	let items = [];
	let editing = null;
	try {
		items = JSON.parse(localStorage.getItem('todos-svelte')) || [];
	} catch (err) {
		items = [];
	}
	const updateView = () => {
		currentFilter = 'all';
		if (window.location.hash === '#/active') {
			currentFilter = 'active';
		} else if (window.location.hash === '#/completed') {
			currentFilter = 'completed';
		}
	};
	window.addEventListener('hashchange', updateView);
	updateView();
	function clearCompleted() {
		items = items.filter(item => !item.completed);
	}
	function remove(index) {
		items = items.slice(0, index).concat(items.slice(index + 1));
	}
	function toggleAll(event) {
		items = items.map(item => ({
			id: item.id,
			description: item.description,
			completed: event.target.checked
		}));
	}
	function createNew(event) {
		if (event.which === ENTER_KEY) {
			items = items.concat({
				id: uuid(),
				description: event.target.value,
				completed: false
			});
			event.target.value = '';
		}
	}
	function handleEdit(event) {
		if (event.which === ENTER_KEY) event.target.blur();
		else if (event.which === ESCAPE_KEY) editing = null;
	}
	function submit(event) {
		items[editing].description = event.target.value;
		editing = null;
	}
	function uuid() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}
	$: filtered = currentFilter === 'all'
		? items
		: currentFilter === 'completed'
			? items.filter(item => item.completed)
			: items.filter(item => !item.completed);
	$: numActive = items.filter(item => !item.completed).length;
	$: numCompleted = items.filter(item => item.completed).length;
	$: try {
		localStorage.setItem('todos-svelte', JSON.stringify(items));
	} catch (err) {
		// noop
	}
</script>

<header class="items-center flex">
	<h1 class="rounded border border-teal-500 border-solid px-20 ">todos</h1>
	<!-- svelte-ignore a11y-autofocus -->
	<input
		class="shadow appearance-none border rounded w-full py-2 px-3 mr-4 text-grey-darker"
		on:keydown={createNew}
		placeholder="What needs to be done?"
		autofocus
	>
</header>

{#if items.length > 0}
	<section class="container bg-white rounded shadow p-6 m-4 w-full lg:w-3/4 lg:max-w-lg">
		<input id="toggle-all" class="inline-block mr-4" type="checkbox" on:change={toggleAll} checked="{numCompleted === items.length}">
		<label for="toggle-all">Mark all as complete</label>

		<ul class="mx-0 list-none bg-clip-padding">
			{#each filtered as item, index (item.id)}
				<li class="{item.completed ? 'line-through' : 'underline'} {editing === index ? 'editing' : ''} 
				py-6 px-2 border-b bol border-grey-darkest flex justify-between items-center relative todo__item">
					<div class="view">
						<input class="inline-block mr-4" type="checkbox" bind:checked={item.completed}>
						<label on:dblclick="{() => editing = index}" class="" >{item.description}</label>
						<button on:click="{() => remove(index)}" class="flex-no-shrink p-2 ml-2 border-2 rounded text-red border-red hover:text-white hover:bg-red bg-red-600 transition">&cross;</button>
					</div>

					{#if editing === index}
						<input
							value='{item.description}'
							id="edit"
							class="edit"
							on:keydown={handleEdit}
							on:blur={submit}
							autofocus
						>
					{/if}
				</li>
			{/each}
		</ul>

		<footer class="">
			<span class="">
				<strong>{numActive}</strong> {numActive === 1 ? 'item' : 'items'} left
			</span>

			<ul class="text-gray-900 mt-2 ml-8">
				<li><a class="{currentFilter === 'all' ? 'shadow border border-teal-500' : ''}" href="#/">All</a></li>
				<li><a class="{currentFilter === 'active' ? 'shadow border border-teal-500' : ''}" href="#/active"> <i class="underline">Active  </i></a></li>
				<li><a class="{currentFilter === 'completed' ? 'shadow border border-teal-500' : ''}" href="#/completed"> <i class="line-through">Completed </i></a></li>
			</ul>

			{#if numCompleted}
				<button class="flex-no-shrink p-2 ml-2 border-2 rounded text-red border-red hover:text-white hover:bg-red bg-red-600" on:click={clearCompleted}>
					Clear completed &cross;
				</button>
			{/if}
		</footer>
	</section>
{/if}
