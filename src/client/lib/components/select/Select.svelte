<script lang="ts" generics="T">
	import { createEventDispatcher } from 'svelte';

	let className = '';

	export { className as class };

	export let textColumn: keyof T | undefined = undefined;
	export let value: T;
	export let items: T[];
	export let id: string | undefined = undefined;
	export let allowEmpty: boolean = false;
</script>

<select {id} bind:value on:blur class={className}>
	{#if allowEmpty && !value}
		<option value={null}>Bitte auswählen</option>
	{/if}
	{#each items as item}
		<option value={item}>
			{#if textColumn}
				{item[textColumn]}
			{:else}
				{item}
			{/if}
		</option>
	{/each}
</select>
