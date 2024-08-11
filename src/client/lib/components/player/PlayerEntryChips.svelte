<script lang="ts">
	import type { ChipsModel } from '@client/lib/models/Chips';
	import Icon from '@iconify/svelte';
	let className = '';
	export { className as class };

	export let chips: ChipsModel | undefined;
	$: isAllIn = chips && chips.bet == chips.chips;
	$: isPleite = chips && chips.chips == 0;
</script>

<div
	class="{className} flex flex-row h-full {isAllIn
		? 'bg-yellow-500'
		: isPleite
			? 'bg-red-400'
			: 'bg-gray-500'} text-right rounded-xl items-center px-2 shadow-sm shadow-black {isPleite
		? 'col-span-3'
		: ''}"
>
	{#if !isPleite}
		<Icon icon="mdi:money" />
	{/if}
	<div class="text-center flex-grow">
		{#if chips}
			{#if isPleite}
				Pleite
			{:else if isAllIn}
				All-In
			{:else}
				{(chips.chips - (chips.bet ?? 0)).toLocaleString()}
			{/if}
		{:else}
			0
		{/if}
	</div>
</div>
