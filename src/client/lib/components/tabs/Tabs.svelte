<script lang="ts">
	import type { TabInfo } from './Tabs.types';

	type T = $$Generic;

	let className = '';
	export let items: TabInfo<T>[] = [];
	export let activeTabValue: T;
	export { className as class };

	const handleClick = (tabValue: T) => () => (activeTabValue = tabValue);
</script>

<ul class="flex flex-wrap p border-b {className}">
	{#each items as item (item.value)}
		<li
			class="px-2 pb-1 rounded-t-md border {activeTabValue === item.value
				? 'bg-black text-white'
				: ''}"
		>
			<button on:click={handleClick(item.value)}>{item.label}</button>
		</li>
	{/each}
</ul>

{#each items as item, key}
	{#if activeTabValue == key}
		<div class="border rounded-xl rounded-t-none p-2 {className}">
			<svelte:component this={item.component} />
		</div>
	{/if}
{/each}
